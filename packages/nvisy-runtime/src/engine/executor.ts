/**
 * Graph execution orchestration.
 *
 * Executes compiled graphs using Effection for structured concurrency.
 * Nodes are spawned as concurrent tasks that communicate via edge queues.
 *
 * The execution model:
 * 1. All nodes are spawned concurrently in topological order
 * 2. Each node waits for its dependencies (incoming edges) to complete
 * 3. Data flows through edges via backpressure-aware queues
 * 4. Node failures are isolated - other branches can continue
 */

import { getLogger } from "@logtape/logtape";
import { CancellationError } from "@nvisy/core";
import {
	run as effectionRun,
	type Operation,
	spawn,
	type WithResolvers,
	withResolvers,
} from "effection";
import type { ExecutionPlan } from "../compiler/index.js";
import type { Registry } from "../registry.js";
import { createLoaderCache } from "./bridge.js";
import type { Connections, ValidatedConnection } from "./connections.js";
import { validateConnections } from "./connections.js";
import { buildEdges, createContext, type ExecutionContext } from "./context.js";
import { executeNode, type NodeResult } from "./nodes.js";

const logger = getLogger(["nvisy", "executor"]);

/** Options for controlling graph execution behaviour. */
export interface ExecuteOptions {
	/** External abort signal; when fired, Effection halts all spawned tasks. */
	readonly signal?: AbortSignal;
	/**
	 * Callback invoked after each source item is read, providing the
	 * resumption context for crash-recovery persistence.
	 */
	readonly onContextUpdate?: (
		nodeId: string,
		connectionId: string,
		context: unknown,
	) => void;
}

/**
 * Result of executing a complete graph.
 *
 * `status` is derived from per-node outcomes:
 * - `"success"` — every node succeeded.
 * - `"partial_failure"` — at least one node failed but others succeeded.
 * - `"failure"` — every node failed.
 */
export interface RunResult {
	readonly runId: string;
	readonly status: "success" | "partial_failure" | "failure";
	readonly nodes: ReadonlyArray<NodeResult>;
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
	registry: Registry,
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

	const ctx = createContext({
		runId,
		plan,
		connections: validatedConnections,
		inEdges,
		outEdges,
		registry,
		loaderCache: createLoaderCache(),
		...(options && { options }),
	});

	for (const id of plan.order) {
		yield* spawnNode(ctx, id, completions);
	}

	const results: NodeResult[] = [];
	for (const id of plan.order) {
		const completion = completions.get(id);
		if (completion) results.push(yield* completion.operation);
	}

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
 */
export async function execute(
	plan: ExecutionPlan,
	connections: Connections,
	registry: Registry,
	options?: ExecuteOptions,
): Promise<RunResult> {
	const signal = options?.signal;

	if (signal?.aborted) {
		throw new CancellationError("Execution cancelled");
	}

	const validatedConnections = validateConnections(plan, connections);

	const task = effectionRun(() =>
		runGraph(plan, validatedConnections, registry, options),
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
