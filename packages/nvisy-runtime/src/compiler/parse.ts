import { Effect, Schema } from "effect";
import { DirectedGraph } from "graphology";
import { GraphDefinition } from "../schema/index.js";
import type { GraphNode } from "../schema/index.js";
import type { ResolvedNode } from "./plan.js";

export interface RuntimeNodeAttrs {
	readonly schema: GraphNode;
	resolved?: ResolvedNode;
}

export interface RuntimeEdgeAttrs {}

export type RuntimeGraph = DirectedGraph<RuntimeNodeAttrs, RuntimeEdgeAttrs>;

export interface ParsedGraph {
	readonly definition: GraphDefinition;
	readonly graph: RuntimeGraph;
}

/**
 * Convert a parsed `GraphDefinition` into a typed `DirectedGraph`.
 */
export const buildRuntimeGraph = (def: GraphDefinition): RuntimeGraph => {
	const graph: RuntimeGraph = new DirectedGraph();

	for (const node of def.nodes) {
		graph.addNode(node.id, { schema: node });
	}

	for (const edge of def.edges) {
		graph.addEdgeWithKey(`${edge.from}->${edge.to}`, edge.from, edge.to);
	}

	return graph;
};

export const parseGraph = (
	input: unknown,
): Effect.Effect<ParsedGraph, Error> =>
	Schema.decodeUnknown(GraphDefinition)(input).pipe(
		Effect.mapError(
			(error) => new Error(`Graph parse error: ${String(error)}`),
		),
		Effect.map((definition) => ({
			definition,
			graph: buildRuntimeGraph(definition),
		})),
	);
