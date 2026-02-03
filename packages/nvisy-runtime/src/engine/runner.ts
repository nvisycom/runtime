import { getLogger } from "@logtape/logtape";
import { CancellationError } from "@nvisy/core";
import {
	run as effectionRun,
	type Operation,
	spawn,
	type WithResolvers,
	withResolvers,
} from "effection";
import type { ExecutionPlan } from "../compiler/plan.js";
import { createEdge, type Edge } from "./edge.js";
import { executeNode } from "./node.js";
import type {
	Connections,
	ExecuteOptions,
	NodeResult,
	RunResult,
} from "./types.js";

const logger = getLogger(["nvisy", "engine"]);

/** Internal state for graph execution. */
interface GraphExecutionContext {
	readonly plan: ExecutionPlan;
	readonly connections: Connections;
	readonly onContextUpdate?: ExecuteOptions["onContextUpdate"];
	readonly runId: string;
	readonly outEdges: Map<string, Edge[]>;
	readonly inEdges: Map<string, Edge[]>;
	readonly completions: Map<string, WithResolvers<NodeResult>>;
}

/**
 * Get a value from a Map, throwing if not found.
 * Replaces non-null assertions with explicit error handling.
 */
function getOrThrow<K, V>(map: ReadonlyMap<K, V>, key: K, label: string): V {
	const value = map.get(key);
	if (value === undefined) {
		throw new Error(`Internal error: missing ${label} for key ${String(key)}`);
	}
	return value;
}

/** Build in/out edge maps from the plan's graph. */
function buildEdgeMaps(
	plan: ExecutionPlan,
): { outEdges: Map<string, Edge[]>; inEdges: Map<string, Edge[]> } {
	const outEdges = new Map<string, Edge[]>();
	const inEdges = new Map<string, Edge[]>();

	for (const id of plan.order) {
		outEdges.set(id, []);
		inEdges.set(id, []);
	}

	for (const edgeKey of plan.graph.edgeEntries()) {
		const edge = createEdge(edgeKey.source, edgeKey.target);
		getOrThrow(outEdges, edgeKey.source, "outEdges").push(edge);
		getOrThrow(inEdges, edgeKey.target, "inEdges").push(edge);
	}

	return { outEdges, inEdges };
}

/** Initialize completion resolvers for all nodes. */
function buildCompletionMap(
	order: ReadonlyArray<string>,
): Map<string, WithResolvers<NodeResult>> {
	const completions = new Map<string, WithResolvers<NodeResult>>();
	for (const id of order) {
		completions.set(id, withResolvers<NodeResult>());
	}
	return completions;
}

/** Spawn a single node's execution task. */
function* spawnNodeTask(ctx: GraphExecutionContext, nodeId: string): Operation<void> {
	const node = ctx.plan.graph.getNodeAttributes(nodeId).schema;
	const resolved = getOrThrow(ctx.plan.resolved, nodeId, "resolved node");
	const nodeIn = getOrThrow(ctx.inEdges, nodeId, "inEdges");
	const nodeOut = getOrThrow(ctx.outEdges, nodeId, "outEdges");
	const nodeCompletion = getOrThrow(ctx.completions, nodeId, "completion");
	const deps = ctx.plan.graph.inNeighbors(nodeId);

	yield* spawn(function* () {
		// Wait for all upstream dependencies to complete
		for (const dep of deps) {
			yield* getOrThrow(ctx.completions, dep, "dependency completion").operation;
		}

		try {
			const result = yield* executeNode(
				node,
				resolved,
				nodeIn,
				nodeOut,
				ctx.connections,
				ctx.onContextUpdate,
			);
			nodeCompletion.resolve(result);
		} catch (error) {
			logger.error("Node {nodeId} failed: {error}", {
				nodeId,
				error: error instanceof Error ? error.message : String(error),
			});
			const failResult: NodeResult = {
				nodeId,
				status: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
				itemsProcessed: 0,
			};
			nodeCompletion.resolve(failResult);
		} finally {
			// Close outgoing edges when done
			for (const edge of nodeOut) {
				edge.queue.close();
			}
		}
	});
}

/** Collect results from all nodes and compute overall status. */
function* collectResults(ctx: GraphExecutionContext): Operation<RunResult> {
	const results: NodeResult[] = [];
	for (const id of ctx.plan.order) {
		results.push(yield* getOrThrow(ctx.completions, id, "completion").operation);
	}

	const hasFailure = results.some((r) => r.status === "failure");
	const allFailure = results.every((r) => r.status === "failure");
	const status = allFailure
		? "failure"
		: hasFailure
			? "partial_failure"
			: "success";

	logger.info("Run {runId} completed ({status})", {
		runId: ctx.runId,
		status,
		nodes: String(results.length),
	});

	return { runId: ctx.runId, status, nodes: results };
}

/**
 * Execute a compiled plan using Effection structured concurrency.
 *
 * 1. Create edges from the plan's graph.
 * 2. Walk topological order, spawning each node when all its
 *    dependencies have completed (tracked via `withResolvers`).
 * 3. Collect results.
 *
 * If the caller halts the operation, Effection automatically
 * halts all spawned node tasks — no manual cleanup needed.
 */
function* runGraph(
	plan: ExecutionPlan,
	connections: Connections,
	onContextUpdate?: ExecuteOptions["onContextUpdate"],
): Operation<RunResult> {
	const runId = crypto.randomUUID();

	logger.info("Run {runId} started ({nodeCount} nodes)", {
		runId,
		nodeCount: plan.order.length,
	});

	const { outEdges, inEdges } = buildEdgeMaps(plan);
	const completions = buildCompletionMap(plan.order);

	const ctx: GraphExecutionContext = {
		plan,
		connections,
		onContextUpdate,
		runId,
		outEdges,
		inEdges,
		completions,
	};

	// Spawn all nodes
	for (const id of plan.order) {
		yield* spawnNodeTask(ctx, id);
	}

	return yield* collectResults(ctx);
}

/** Async entry point for callers outside Effection scope. */
export async function execute(
	plan: ExecutionPlan,
	connections: Connections,
	options?: ExecuteOptions,
): Promise<RunResult> {
	const signal = options?.signal;

	// Check if already aborted before starting
	if (signal?.aborted) {
		throw new CancellationError("Execution cancelled");
	}

	const task = effectionRun(function* () {
		return yield* runGraph(plan, connections, options?.onContextUpdate);
	});

	// No signal - just await the task
	if (!signal) {
		return await task;
	}

	// Set up abort listener
	const onAbort = () => void task.halt();
	signal.addEventListener("abort", onAbort, { once: true });

	try {
		return await task;
	} finally {
		signal.removeEventListener("abort", onAbort);
	}
}
