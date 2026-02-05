/**
 * Graph execution engine.
 *
 * This module executes compiled graphs using Effection for structured
 * concurrency. Nodes are spawned as concurrent tasks that communicate
 * via edge queues. The execution model:
 *
 * 1. All nodes are spawned concurrently in topological order
 * 2. Each node waits for its dependencies (incoming edges) to complete
 * 3. Data flows through edges via backpressure-aware queues
 * 4. Node failures are isolated - other branches can continue
 *
 * Supports cancellation via AbortSignal and retry/timeout policies.
 */

import { getLogger } from "@logtape/logtape";
import type { Data } from "@nvisy/core";
import { CancellationError, RuntimeError, ValidationError } from "@nvisy/core";
import {
	call,
	run as effectionRun,
	type Operation,
	spawn,
	type WithResolvers,
	withResolvers,
} from "effection";
import type { ExecutionPlan } from "../compiler/index.js";
import type {
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "../compiler/plan.js";
import type { GraphNode } from "../schema.js";
import {
	buildEdges,
	createContext,
	type Edge,
	type ExecutionContext,
	type ValidatedConnection,
	validateConnections,
} from "./context.js";
import { withRetry, withTimeout } from "./policies.js";
import type {
	Connections,
	ExecuteOptions,
	NodeResult,
	RunResult,
} from "./types.js";

const logger = getLogger(["nvisy", "engine"]);

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

	// Connect to provider if action requires a client
	if (resolved.provider && resolved.connection) {
		const conn = ctx.connections.get(resolved.connection);
		if (!conn) {
			throw new ValidationError(
				`Connection not found: ${resolved.connection}`,
				{
					source: "engine",
					retryable: false,
				},
			);
		}
		const instance = yield* call(() => conn.provider.connect(conn.credentials));
		client = instance.client;
		disconnect = () => instance.disconnect();

		// Verify client compatibility with action
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
		const inputStream = yield* edgesToStream(inEdges);
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
			{
				source: "engine",
				retryable: false,
			},
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
function* executeNode(
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
		error: new RuntimeError(`Node ${nodeId} timed out after ${timeoutMs}ms`, {
			source: "engine",
			retryable: true,
		}),
		itemsProcessed: 0,
	};

	return yield* withTimeout(
		() => withRetry(base, node.retry, nodeId),
		timeoutMs,
		timeoutFallback,
	);
}

/**
 * Spawn a node as a concurrent task.
 *
 * Waits for all dependencies to complete before executing.
 * Closes outgoing edge queues when done (success or failure).
 */
function* spawnNode(
	ctx: ExecutionContext,
	nodeId: string,
	completions: ReadonlyMap<string, WithResolvers<NodeResult>>,
): Operation<void> {
	const deps = ctx.plan.graph.inNeighbors(nodeId);
	const completion = completions.get(nodeId);
	if (!completion) return;

	const outEdges = ctx.outEdges.get(nodeId) ?? [];

	yield* spawn(function* () {
		// Wait for dependencies
		for (const dep of deps) {
			const depCompletion = completions.get(dep);
			if (depCompletion) yield* depCompletion.operation;
		}

		try {
			const result = yield* executeNode(ctx, nodeId);
			completion.resolve(result);
		} catch (error) {
			logger.error("Node {nodeId} failed: {error}", {
				nodeId,
				error: error instanceof Error ? error.message : String(error),
			});
			completion.resolve({
				nodeId,
				status: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
				itemsProcessed: 0,
			});
		} finally {
			// Close outgoing edges to signal completion to downstream nodes
			for (const edge of outEdges) {
				edge.queue.close();
			}
		}
	});
}

/**
 * Execute a graph within Effection structured concurrency.
 *
 * Spawns all nodes concurrently and collects results.
 * Determines overall status based on individual node results.
 */
function* runGraph(
	plan: ExecutionPlan,
	validatedConnections: Map<string, ValidatedConnection>,
	options?: ExecuteOptions,
): Operation<RunResult> {
	const runId = crypto.randomUUID();
	logger.info("Run {runId} started ({count} nodes)", {
		runId,
		count: plan.order.length,
	});

	const { inEdges, outEdges } = buildEdges(plan);
	const completions = new Map<string, WithResolvers<NodeResult>>();
	for (const id of plan.order) {
		completions.set(id, withResolvers<NodeResult>());
	}

	const ctx = createContext(
		runId,
		plan,
		validatedConnections,
		inEdges,
		outEdges,
		options,
	);

	// Spawn all nodes concurrently
	for (const id of plan.order) {
		yield* spawnNode(ctx, id, completions);
	}

	// Collect results in topological order
	const results: NodeResult[] = [];
	for (const id of plan.order) {
		const completion = completions.get(id);
		if (completion) results.push(yield* completion.operation);
	}

	// Determine overall status
	const hasFailure = results.some((r) => r.status === "failure");
	const allFailure = results.every((r) => r.status === "failure");
	const status = allFailure
		? "failure"
		: hasFailure
			? "partial_failure"
			: "success";

	logger.info("Run {runId} completed ({status})", { runId, status });
	return { runId, status, nodes: results };
}

/**
 * Execute a compiled execution plan.
 *
 * This is the main entry point for graph execution. It:
 * 1. Validates all connections upfront
 * 2. Runs the graph using Effection structured concurrency
 * 3. Handles cancellation via AbortSignal
 *
 * @param plan - Compiled execution plan from the compiler.
 * @param connections - Connection credentials keyed by ID.
 * @param options - Execution options (signal, callbacks).
 * @returns Promise resolving to the run result.
 * @throws CancellationError if aborted before or during execution.
 */
export async function execute(
	plan: ExecutionPlan,
	connections: Connections,
	options?: ExecuteOptions,
): Promise<RunResult> {
	const signal = options?.signal;

	if (signal?.aborted) {
		throw new CancellationError("Execution cancelled");
	}

	const validatedConnections = validateConnections(plan, connections);

	const task = effectionRun(() =>
		runGraph(plan, validatedConnections, options),
	);

	if (!signal) {
		return task;
	}

	const onAbort = () => void task.halt();
	signal.addEventListener("abort", onAbort, { once: true });

	try {
		return await task;
	} finally {
		signal.removeEventListener("abort", onAbort);
	}
}
