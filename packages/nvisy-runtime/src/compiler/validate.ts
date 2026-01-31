import { Effect } from "effect";
import type { GraphDefinition } from "../schema/index.js";

export const validateGraph = (
	graph: GraphDefinition,
): Effect.Effect<GraphDefinition, Error> =>
	Effect.gen(function* () {
		// TODO: cycle detection via topological sort
		// TODO: dangling node reference checks
		// TODO: type compatibility between connected nodes
		// TODO: connector/action name resolution against registries
		return graph;
	});
