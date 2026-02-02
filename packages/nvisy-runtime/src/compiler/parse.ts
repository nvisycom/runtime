import { getLogger } from "@logtape/logtape";
import { DirectedGraph } from "graphology";
import { GraphDefinition } from "../schema/index.js";
import type { GraphNode } from "../schema/index.js";
import type { ResolvedNode } from "./plan.js";

const logger = getLogger(["nvisy", "compiler"]);

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

export const parseGraph = (input: unknown): ParsedGraph => {
	const result = GraphDefinition.safeParse(input);
	if (!result.success) {
		logger.warn("Graph parse failed: {error}", { error: result.error.message });
		throw new Error(`Graph parse error: ${result.error.message}`);
	}
	const definition = result.data;
	logger.debug("Graph parsed: {graphId} ({nodeCount} nodes, {edgeCount} edges)", {
		graphId: definition.id,
		nodeCount: definition.nodes.length,
		edgeCount: definition.edges.length,
	});
	return {
		definition,
		graph: buildRuntimeGraph(definition),
	};
};
