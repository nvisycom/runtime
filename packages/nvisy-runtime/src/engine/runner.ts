import { Effect, Fiber } from "effect";
import type { ExecutionPlan } from "../compiler/plan.js";
import { createEdge, type Edge } from "./edge.js";
import { executeNode, type NodeResult } from "./node.js";
import { createPool } from "./pool.js";

export interface RunResult {
	readonly runId: string;
	readonly status: "success" | "partial_failure" | "failure";
	readonly nodes: ReadonlyArray<NodeResult>;
}

/**
 * Execute a compiled plan.
 *
 * 1. Create a fiber pool with the graph's concurrency limit.
 * 2. Wire edges between nodes using graphology queries.
 * 3. Walk the topological order, launching each node inside the pool.
 * 4. Collect and return results.
 */
export const run = (
	plan: ExecutionPlan,
): Effect.Effect<RunResult, Error> =>
	Effect.gen(function* () {
		const runId = crypto.randomUUID();
		const concurrency = plan.definition.concurrency?.maxGlobal ?? 10;
		const pool = yield* createPool(concurrency);

		// ── Build edge map using graphology queries ────────────────────
		const edgeMap = new Map<string, Edge>();
		const outEdges = new Map<string, Edge[]>();
		const inEdges = new Map<string, Edge[]>();

		for (const id of plan.order) {
			outEdges.set(id, []);
			inEdges.set(id, []);
		}

		for (const edgeKey of plan.graph.edgeEntries()) {
			const edge = yield* createEdge(edgeKey.source, edgeKey.target);
			edgeMap.set(edgeKey.edge, edge);
			outEdges.get(edgeKey.source)!.push(edge);
			inEdges.get(edgeKey.target)!.push(edge);
		}

		// ── Execute in topological order ───────────────────────────────
		const results: NodeResult[] = [];
		const fibers = new Map<string, Fiber.Fiber<NodeResult, Error>>();

		for (const id of plan.order) {
			const attrs = plan.graph.getNodeAttributes(id);
			const node = attrs.schema;
			const resolved = attrs.resolved!;
			const nodeIn = inEdges.get(id)!;
			const nodeOut = outEdges.get(id)!;

			// Wait for all upstream fibers to complete
			for (const dep of plan.graph.inNeighbors(id)) {
				const fiber = fibers.get(dep);
				if (fiber) yield* Fiber.join(fiber);
			}

			const fiber = yield* pool.withPermit(
				executeNode(node, resolved, nodeIn, nodeOut),
			).pipe(Effect.fork);

			fibers.set(id, fiber);
		}

		// ── Collect results ────────────────────────────────────────────
		for (const id of plan.order) {
			const fiber = fibers.get(id)!;
			const result = yield* Fiber.join(fiber).pipe(
				Effect.catchAll((error) =>
					Effect.succeed({
						nodeId: id,
						status: "failure" as const,
						error: error instanceof Error ? error : new Error(String(error)),
						itemsProcessed: 0,
					}),
				),
			);
			results.push(result);
		}

		const hasFailure = results.some((r) => r.status === "failure");
		const allFailure = results.every((r) => r.status === "failure");

		yield* Effect.log(`Run ${runId} completed`)
			.pipe(Effect.annotateLogs({
				runId,
				status: allFailure ? "failure" : hasFailure ? "partial_failure" : "success",
				nodes: String(results.length),
			}));

		return {
			runId,
			status: allFailure ? "failure" : hasFailure ? "partial_failure" : "success",
			nodes: results,
		};
	});
