import { Effect } from "effect";
import type { GraphDefinition } from "../schema/index.js";

export interface ExecutionPlan {
	readonly graph: GraphDefinition;
	readonly order: ReadonlyArray<string>;
	// TODO: resolved connectors, actions, concurrency constraints, rate limits
}

export const buildPlan = (
	graph: GraphDefinition,
): Effect.Effect<ExecutionPlan, Error> =>
	Effect.gen(function* () {
		// TODO: resolve all names via registries
		// TODO: compute topological execution order
		// TODO: aggregate concurrency constraints
		// TODO: wire rate limit policies
		const order = graph.nodes.map((n) => n.id);
		return { graph, order };
	});
