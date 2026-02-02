import { getLogger } from "@logtape/logtape";
import type { ExecutionPlan } from "../compiler/plan.js";
import { createEdge, type Edge } from "./edge.js";
import { executeNode, type NodeResult } from "./node.js";
import { createPool } from "./pool.js";

const logger = getLogger(["nvisy", "engine"]);

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
export const run = async (
	plan: ExecutionPlan,
): Promise<RunResult> => {
	const runId = crypto.randomUUID();
	const concurrency = plan.definition.concurrency?.maxGlobal ?? 10;
	const pool = createPool(concurrency);

	logger.info("Run {runId} started ({nodeCount} nodes, concurrency {concurrency})", {
		runId,
		nodeCount: plan.order.length,
		concurrency,
	});

	const edgeMap = new Map<string, Edge>();
	const outEdges = new Map<string, Edge[]>();
	const inEdges = new Map<string, Edge[]>();

	for (const id of plan.order) {
		outEdges.set(id, []);
		inEdges.set(id, []);
	}

	for (const edgeKey of plan.graph.edgeEntries()) {
		const edge = createEdge(edgeKey.source, edgeKey.target);
		edgeMap.set(edgeKey.edge, edge);
		outEdges.get(edgeKey.source)!.push(edge);
		inEdges.get(edgeKey.target)!.push(edge);
	}

	const results: NodeResult[] = [];
	const promises = new Map<string, Promise<NodeResult>>();

	for (const id of plan.order) {
		const attrs = plan.graph.getNodeAttributes(id);
		const node = attrs.schema;
		const resolved = attrs.resolved!;
		const nodeIn = inEdges.get(id)!;
		const nodeOut = outEdges.get(id)!;

		// Wait for all upstream nodes to complete
		const deps = plan.graph.inNeighbors(id);
		await Promise.all(deps.map((dep) => promises.get(dep)));

		const promise = pool.withPermit(() =>
			executeNode(node, resolved, nodeIn, nodeOut),
		).catch((error): NodeResult => {
			logger.error("Node {nodeId} failed: {error}", {
				nodeId: id,
				error: error instanceof Error ? error.message : String(error),
			});
			return {
				nodeId: id,
				status: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
				itemsProcessed: 0,
			};
		});

		promises.set(id, promise);
	}

	for (const id of plan.order) {
		results.push(await promises.get(id)!);
	}

	const hasFailure = results.some((r) => r.status === "failure");
	const allFailure = results.every((r) => r.status === "failure");
	const status = allFailure ? "failure" : hasFailure ? "partial_failure" : "success";

	logger.info(`Run ${runId} completed`, {
		runId,
		status,
		nodes: String(results.length),
	});

	return { runId, status, nodes: results };
};
