import { getLogger } from "@logtape/logtape";
import { ValidationError } from "@nvisy/core";
import { DirectedGraph } from "graphology";
import { Graph, type GraphNode } from "../schema.js";

const logger = getLogger(["nvisy", "compiler"]);

/** Node attributes stored in the runtime graph. */
export interface RuntimeNodeAttrs {
	readonly schema: GraphNode;
}

/** Graphology directed graph with typed node and edge attributes. */
export type RuntimeGraph = DirectedGraph<RuntimeNodeAttrs>;

/** Result of parsing a graph definition. */
export interface ParsedGraph {
	readonly definition: Graph;
	readonly graph: RuntimeGraph;
}

/** Convert a parsed Graph into a graphology DirectedGraph. */
function buildRuntimeGraph(def: Graph): RuntimeGraph {
	const graph: RuntimeGraph = new DirectedGraph();

	for (const node of def.nodes) {
		graph.addNode(node.id, { schema: node });
	}

	for (const edge of def.edges) {
		graph.addEdgeWithKey(`${edge.from}->${edge.to}`, edge.from, edge.to);
	}

	return graph;
}

/** Parse and validate a graph definition from unknown input. */
export function parseGraph(input: unknown): ParsedGraph {
	const result = Graph.safeParse(input);
	if (!result.success) {
		logger.warn("Graph parse failed: {error}", { error: result.error.message });
		throw new ValidationError(`Graph parse error: ${result.error.message}`, {
			source: "compiler",
			retryable: false,
		});
	}

	const definition = result.data;
	logger.debug(
		"Graph parsed: {graphId} ({nodeCount} nodes, {edgeCount} edges)",
		{
			graphId: definition.id,
			nodeCount: definition.nodes.length,
			edgeCount: definition.edges.length,
		},
	);
	return {
		definition,
		graph: buildRuntimeGraph(definition),
	};
}
