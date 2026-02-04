import { getLogger } from "@logtape/logtape";
import type { AnyProviderFactory, Data } from "@nvisy/core";
import { RuntimeError, ValidationError } from "@nvisy/core";
import { call, type Operation } from "effection";
import type {
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "../compiler/plan.js";
import type { GraphNode } from "../schema.js";
import { type Edge, edgesToIterable } from "./edge.js";
import { withRetry, withTimeout } from "./policies.js";
import type { Connections, ExecuteOptions, NodeResult } from "./types.js";
import { validateParams } from "./validation.js";

const logger = getLogger(["nvisy", "engine"]);

/**
 * Resolve a connection for a node from the connections map.
 * Validates the credential value against the provider's schema.
 * Returns the full Connection object (credentials + context).
 */
function resolveConnection(
	resolved:
		| ResolvedSourceNode
		| ResolvedTargetNode
		| (ResolvedActionNode & {
				provider: AnyProviderFactory;
				connection: string;
		  }),
	connections: Connections,
	nodeId: string,
) {
	const connId = resolved.connection;
	const connection = connections[connId];
	if (!connection) {
		throw new ValidationError(
			`Missing connection "${connId}" for node ${nodeId}`,
			{ source: "engine", retryable: false },
		);
	}

	const credentials = validateParams(
		resolved.provider.credentialSchema,
		connection.credentials,
		`credentials for node ${nodeId}`,
	);
	return { ...connection, credentials };
}

function* executeSource(
	node: GraphNode,
	resolved: ResolvedSourceNode,
	outEdges: ReadonlyArray<Edge>,
	connections: Connections,
	onContextUpdate?: ExecuteOptions["onContextUpdate"],
): Operation<number> {
	const connection = resolveConnection(resolved, connections, node.id);
	const streamParams = validateParams(
		resolved.stream.paramSchema,
		resolved.params,
		`stream params for source node ${node.id}`,
	);

	const instance = yield* call(() =>
		resolved.provider.connect(connection.credentials),
	);
	let itemsProcessed = 0;

	try {
		const initialCtx =
			connection.context != null
				? resolved.stream.contextSchema.parse(connection.context)
				: resolved.stream.contextSchema.parse({});

		const readable = resolved.stream.read(
			instance.client,
			initialCtx,
			streamParams,
		);

		yield* call(async () => {
			for await (const resumable of readable) {
				for (const edge of outEdges) {
					edge.queue.add(resumable.data);
				}
				itemsProcessed++;
				onContextUpdate?.(node.id, resolved.connection, resumable.context);
			}
		});
	} finally {
		yield* call(() => instance.disconnect());
	}

	return itemsProcessed;
}

function* executeAction(
	node: GraphNode,
	resolved: ResolvedActionNode,
	inEdges: ReadonlyArray<Edge>,
	outEdges: ReadonlyArray<Edge>,
	connections: Connections,
): Operation<number> {
	const actionParams = validateParams(
		resolved.action.schema,
		resolved.params,
		`action params for node ${node.id}`,
	);

	let client: unknown;
	let disconnect: (() => Promise<void>) | undefined;

	if (resolved.provider && resolved.connection) {
		const connection = resolveConnection(
			resolved as ResolvedActionNode & {
				provider: AnyProviderFactory;
				connection: string;
			},
			connections,
			node.id,
		);
		const instance = yield* call(() =>
			resolved.provider!.connect(connection.credentials),
		);
		client = instance.client;

		if (
			resolved.action.clientClass &&
			!(client instanceof resolved.action.clientClass)
		) {
			throw new ValidationError(
				`Provider "${resolved.provider!.id}" client is not compatible with action "${resolved.action.id}" (expected ${resolved.action.clientClass.name})`,
				{ source: "engine", retryable: false },
			);
		}

		disconnect = () => instance.disconnect();
	}

	try {
		const inputStream = yield* edgesToIterable(inEdges);
		const outputStream = resolved.action.pipe(
			inputStream,
			actionParams,
			client,
		);
		let itemsProcessed = 0;

		yield* call(async () => {
			for await (const item of outputStream) {
				for (const edge of outEdges) {
					edge.queue.add(item as Data);
				}
				itemsProcessed++;
			}
		});

		return itemsProcessed;
	} finally {
		if (disconnect) yield* call(disconnect);
	}
}

function* executeTarget(
	node: GraphNode,
	resolved: ResolvedTargetNode,
	inEdges: ReadonlyArray<Edge>,
	connections: Connections,
): Operation<number> {
	const connection = resolveConnection(resolved, connections, node.id);
	const streamParams = validateParams(
		resolved.stream.paramSchema,
		resolved.params,
		`stream params for target node ${node.id}`,
	);

	const instance = yield* call(() =>
		resolved.provider.connect(connection.credentials),
	);
	let itemsProcessed = 0;

	try {
		const writeFn = resolved.stream.write(instance.client, streamParams);
		for (const edge of inEdges) {
			let next = yield* edge.queue.next();
			while (!next.done) {
				yield* call(() => writeFn(next.value as Data));
				itemsProcessed++;
				next = yield* edge.queue.next();
			}
		}
	} finally {
		yield* call(() => instance.disconnect());
	}

	return itemsProcessed;
}

/**
 * Execute a single graph node.
 *
 * @param node - The schema node (carries retry/timeout policies).
 * @param resolved - Pre-resolved registry entry from the plan.
 * @param inEdges - Edges feeding data into this node.
 * @param outEdges - Edges carrying data out of this node.
 * @param connections - Validated connection map from the caller.
 * @param onContextUpdate - Optional callback for context updates.
 */
export function* executeNode(
	node: GraphNode,
	resolved: ResolvedNode,
	inEdges: ReadonlyArray<Edge>,
	outEdges: ReadonlyArray<Edge>,
	connections: Connections,
	onContextUpdate?: ExecuteOptions["onContextUpdate"],
): Operation<NodeResult> {
	logger.debug("Executing node {nodeId} ({type})", {
		nodeId: node.id,
		type: resolved.type,
	});

	function* base(): Operation<NodeResult> {
		let itemsProcessed: number;

		switch (resolved.type) {
			case "source":
				itemsProcessed = yield* executeSource(
					node,
					resolved,
					outEdges,
					connections,
					onContextUpdate,
				);
				break;
			case "action":
				itemsProcessed = yield* executeAction(
					node,
					resolved,
					inEdges,
					outEdges,
					connections,
				);
				break;
			case "target":
				itemsProcessed = yield* executeTarget(
					node,
					resolved,
					inEdges,
					connections,
				);
				break;
		}

		logger.debug("Node {nodeId} completed, {itemsProcessed} items processed", {
			nodeId: node.id,
			itemsProcessed,
		});

		return {
			nodeId: node.id,
			status: "success" as const,
			itemsProcessed,
		};
	}

	const timeoutMs = node.timeout?.nodeTimeoutMs;
	const timeoutFallback: NodeResult = {
		nodeId: node.id,
		status: "failure",
		error: new RuntimeError(`Node ${node.id} timed out after ${timeoutMs}ms`, {
			source: "engine",
			retryable: true,
			details: { nodeId: node.id, timeoutMs },
		}),
		itemsProcessed: 0,
	};

	return yield* withTimeout(
		() => withRetry(base, node.retry, node.id),
		timeoutMs,
		timeoutFallback,
	);
}
