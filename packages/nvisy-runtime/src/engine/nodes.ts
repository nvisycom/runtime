/**
 * Node execution logic for source, action, and target nodes.
 *
 * Each node type has a dedicated executor that handles:
 * - Provider connection management
 * - Parameter validation
 * - Data streaming through edges
 */

import { getLogger } from "@logtape/logtape";
import type { Data } from "@nvisy/core";
import { TimeoutError, ValidationError } from "@nvisy/core";
import { call, type Operation, spawn } from "effection";
import type {
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "../compiler/plan.js";
import type { GraphNode } from "../schema.js";
import { applyLoaderBridge } from "./bridge.js";
import type { Edge, ExecutionContext } from "./context.js";
import { withRetry, withTimeout } from "./policies.js";

const logger = getLogger(["nvisy", "nodes"]);

/** Result of executing a single node. */
export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly itemsProcessed: number;
}

/** Validate parameters against a Zod-like schema. */
function validateParams<T>(
	schema: {
		safeParse: (
			v: unknown,
		) =>
			| { success: true; data: T }
			| { success: false; error: { message: string } };
	},
	params: unknown,
	nodeId: string,
): T {
	const result = schema.safeParse(params);
	if (!result.success) {
		throw new ValidationError(
			`Invalid params for node ${nodeId}: ${result.error.message}`,
			{ source: "engine", retryable: false },
		);
	}
	return result.data;
}

/**
 * Convert edge queues to a ReadableStream.
 *
 * Spawns a background task that drains each edge queue sequentially
 * and writes items to a TransformStream. The readable side is returned
 * for consumption by action nodes.
 */
function* edgesToStream(edges: Edge[]): Operation<ReadableStream<Data>> {
	const { readable, writable } = new TransformStream<Data>();

	yield* spawn(function* () {
		const writer = writable.getWriter();
		try {
			for (const edge of edges) {
				for (
					let next = yield* edge.queue.next();
					!next.done;
					next = yield* edge.queue.next()
				) {
					yield* call(() => writer.write(next.value));
				}
			}
		} finally {
			yield* call(() => writer.close());
		}
	});

	return readable;
}

/**
 * Execute a source node: read data from an external system.
 *
 * Connects to the provider, reads items via the stream, and pushes
 * each item to all outgoing edges. Emits context updates for
 * crash recovery.
 */
function* executeSource(
	ctx: ExecutionContext,
	node: GraphNode,
	resolved: ResolvedSourceNode,
	outEdges: Edge[],
): Operation<number> {
	const conn = ctx.getConnection(node.id);
	const params = validateParams(
		resolved.stream.paramSchema,
		resolved.params,
		node.id,
	);

	const instance = yield* call(() => conn.provider.connect(conn.credentials));
	let count = 0;

	try {
		const initialCtx = resolved.stream.contextSchema.parse(conn.context ?? {});
		const readable = resolved.stream.read(instance.client, initialCtx, params);

		yield* call(async () => {
			for await (const resumable of readable) {
				for (const edge of outEdges) {
					edge.queue.add(resumable.data);
				}
				count++;
				ctx.options?.onContextUpdate?.(
					node.id,
					resolved.connection,
					resumable.context,
				);
			}
		});
	} finally {
		yield* call(() => instance.disconnect());
	}

	return count;
}

/**
 * Execute an action node: transform data through a processing function.
 *
 * Optionally connects to a provider if the action requires a client.
 * Reads from incoming edges, applies the transformation, and writes
 * to outgoing edges.
 */
function* executeAction(
	ctx: ExecutionContext,
	node: GraphNode,
	resolved: ResolvedActionNode,
	inEdges: Edge[],
	outEdges: Edge[],
): Operation<number> {
	const params = validateParams(
		resolved.action.schema,
		resolved.params,
		node.id,
	);

	let client: unknown;
	let disconnect: (() => Promise<void>) | undefined;

	if (resolved.provider && resolved.connection) {
		const conn = ctx.connections.get(resolved.connection);
		if (!conn) {
			throw new ValidationError(
				`Connection not found: ${resolved.connection}`,
				{ source: "engine", retryable: false },
			);
		}
		const instance = yield* call(() => conn.provider.connect(conn.credentials));
		client = instance.client;
		disconnect = () => instance.disconnect();

		if (
			resolved.action.clientClass &&
			!(client instanceof resolved.action.clientClass)
		) {
			throw new ValidationError(
				`Provider "${resolved.provider.id}" client is not compatible with action "${resolved.action.id}"`,
				{ source: "engine", retryable: false },
			);
		}
	}

	try {
		const rawInputStream = yield* edgesToStream(inEdges);
		const inputStream = applyLoaderBridge(
			rawInputStream,
			ctx.registry,
			ctx.loaderCache,
		);
		const outputStream = resolved.action.pipe(inputStream, params, client);
		let count = 0;

		yield* call(async () => {
			for await (const item of outputStream) {
				for (const edge of outEdges) {
					edge.queue.add(item);
				}
				count++;
			}
		});

		return count;
	} finally {
		if (disconnect) yield* call(disconnect);
	}
}

/**
 * Execute a target node: write data to an external system.
 *
 * Connects to the provider and writes each item from incoming edges
 * using the stream's writer function.
 */
function* executeTarget(
	ctx: ExecutionContext,
	node: GraphNode,
	resolved: ResolvedTargetNode,
	inEdges: Edge[],
): Operation<number> {
	const conn = ctx.getConnection(node.id);
	const params = validateParams(
		resolved.stream.paramSchema,
		resolved.params,
		node.id,
	);

	const instance = yield* call(() => conn.provider.connect(conn.credentials));
	let count = 0;

	try {
		const writeFn = resolved.stream.write(instance.client, params);
		for (const edge of inEdges) {
			for (
				let next = yield* edge.queue.next();
				!next.done;
				next = yield* edge.queue.next()
			) {
				yield* call(() => writeFn(next.value));
				count++;
			}
		}
	} finally {
		yield* call(() => instance.disconnect());
	}

	return count;
}

/** Dispatch to the appropriate node executor based on type. */
function* dispatchNode(
	ctx: ExecutionContext,
	node: GraphNode,
	resolved: ResolvedNode,
	inEdges: Edge[],
	outEdges: Edge[],
): Operation<number> {
	switch (resolved.type) {
		case "source":
			return yield* executeSource(ctx, node, resolved, outEdges);
		case "action":
			return yield* executeAction(ctx, node, resolved, inEdges, outEdges);
		case "target":
			return yield* executeTarget(ctx, node, resolved, inEdges);
	}
}

/**
 * Execute a single node with retry and timeout policies.
 *
 * Wraps the node execution with configurable retry logic and timeout.
 * Returns a NodeResult indicating success or failure.
 */
export function* executeNode(
	ctx: ExecutionContext,
	nodeId: string,
): Operation<NodeResult> {
	const node = ctx.getNode(nodeId);
	const resolved = ctx.getResolved(nodeId);
	const inEdges = ctx.inEdges.get(nodeId) ?? [];
	const outEdges = ctx.outEdges.get(nodeId) ?? [];

	logger.debug("Executing node {nodeId} ({type})", {
		nodeId,
		type: resolved.type,
	});

	function* base(): Operation<NodeResult> {
		const count = yield* dispatchNode(ctx, node, resolved, inEdges, outEdges);

		logger.debug("Node {nodeId} completed ({count} items)", { nodeId, count });
		return { nodeId, status: "success", itemsProcessed: count };
	}

	const timeoutMs = node.timeout?.nodeTimeoutMs;
	const timeoutFallback: NodeResult = {
		nodeId,
		status: "failure",
		error: new TimeoutError(`Node ${nodeId} timed out after ${timeoutMs}ms`, {
			source: "engine",
		}),
		itemsProcessed: 0,
	};

	return yield* withTimeout(
		() => withRetry(base, node.retry, nodeId),
		timeoutMs,
		timeoutFallback,
	);
}
