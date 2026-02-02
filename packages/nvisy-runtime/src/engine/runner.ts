import { getLogger } from "@logtape/logtape";
import {
	type Operation,
	spawn,
	run as effectionRun,
	withResolvers,
	type WithResolvers,
} from "effection";
import type { ExecutionPlan } from "../compiler/plan.js";
import { createEdge, type Edge } from "./edge.js";
import { executeNode, type NodeResult } from "./node.js";

const logger = getLogger(["nvisy", "engine"]);

export interface RunResult {
	readonly runId: string;
	readonly status: "success" | "partial_failure" | "failure";
	readonly nodes: ReadonlyArray<NodeResult>;
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
function* runGraph(plan: ExecutionPlan): Operation<RunResult> {
	const runId = crypto.randomUUID();

	logger.info("Run {runId} started ({nodeCount} nodes)", {
		runId,
		nodeCount: plan.order.length,
	});

	// Build edge maps
	const outEdges = new Map<string, Edge[]>();
	const inEdges = new Map<string, Edge[]>();

	for (const id of plan.order) {
		outEdges.set(id, []);
		inEdges.set(id, []);
	}

	for (const edgeKey of plan.graph.edgeEntries()) {
		const edge = createEdge(edgeKey.source, edgeKey.target);
		outEdges.get(edgeKey.source)!.push(edge);
		inEdges.get(edgeKey.target)!.push(edge);
	}

	// Track completion: nodeId -> resolvers that signal when node finishes
	const completions = new Map<string, WithResolvers<NodeResult>>();
	for (const id of plan.order) {
		completions.set(id, withResolvers<NodeResult>());
	}

	// Spawn all nodes — each waits for its upstream deps before executing
	for (const id of plan.order) {
		const attrs = plan.graph.getNodeAttributes(id);
		const node = attrs.schema;
		const resolved = attrs.resolved!;
		const nodeIn = inEdges.get(id)!;
		const nodeOut = outEdges.get(id)!;
		const deps = plan.graph.inNeighbors(id);

		yield* spawn(function* () {
			// Wait for all upstream dependencies to complete
			for (const dep of deps) {
				yield* completions.get(dep)!.operation;
			}

			try {
				const result = yield* executeNode(node, resolved, nodeIn, nodeOut);
				completions.get(id)!.resolve(result);
			} catch (error) {
				logger.error("Node {nodeId} failed: {error}", {
					nodeId: id,
					error: error instanceof Error ? error.message : String(error),
				});
				const failResult: NodeResult = {
					nodeId: id,
					status: "failure",
					error: error instanceof Error ? error : new Error(String(error)),
					itemsProcessed: 0,
				};
				completions.get(id)!.resolve(failResult);
			} finally {
				// Close outgoing edges when done
				for (const edge of nodeOut) {
					edge.queue.close();
				}
			}
		});
	}

	// Collect all results in topological order
	const results: NodeResult[] = [];
	for (const id of plan.order) {
		results.push(yield* completions.get(id)!.operation);
	}

	const hasFailure = results.some((r) => r.status === "failure");
	const allFailure = results.every((r) => r.status === "failure");
	const status = allFailure ? "failure" : hasFailure ? "partial_failure" : "success";

	logger.info("Run {runId} completed ({status})", {
		runId,
		status,
		nodes: String(results.length),
	});

	return { runId, status, nodes: results };
}

/** Async entry point for callers outside Effection scope. */
export async function execute(plan: ExecutionPlan): Promise<RunResult> {
	return await effectionRun(function* () {
		return yield* runGraph(plan);
	});
}

export { runGraph as run };
