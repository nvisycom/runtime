import { Effect } from "effect";
import type { ExecutionPlan } from "../compiler/plan.js";
import type { NodeResult } from "./node.js";

export interface RunResult {
	readonly runId: string;
	readonly status: "success" | "partial_failure" | "failure";
	readonly nodes: ReadonlyArray<NodeResult>;
}

export const run = (
	plan: ExecutionPlan,
): Effect.Effect<RunResult, Error> =>
	Effect.gen(function* () {
		const runId = crypto.randomUUID();

		// TODO: create fiber pool with concurrency from plan
		// TODO: wire edges between nodes based on DAG
		// TODO: walk DAG in topological order
		// TODO: manage ready queue, running pool, retry queue, done store
		// TODO: collect results from all nodes

		return {
			runId,
			status: "success" as const,
			nodes: [],
		};
	});
