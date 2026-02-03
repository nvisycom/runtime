import { getLogger } from "@logtape/logtape";
import type { AnyActionInstance, AnyProviderFactory } from "@nvisy/core";
import { topologicalSort } from "graphology-dag";
import type { Registry } from "../registry/index.js";
import type { GraphDefinition } from "../schema/index.js";
import type { ParsedGraph, RuntimeGraph } from "./parse.js";

const logger = getLogger(["nvisy", "compiler"]);

/**
 * A resolved reference to a registry entry, carried alongside the
 * node so the engine never needs to look things up at execution time.
 */
export type ResolvedNode =
	| {
			readonly type: "source";
			readonly provider: AnyProviderFactory;
			readonly params: Readonly<Record<string, unknown>>;
	  }
	| {
			readonly type: "action";
			readonly action: AnyActionInstance;
			readonly params: Readonly<Record<string, unknown>>;
	  }
	| {
			readonly type: "target";
			readonly provider: AnyProviderFactory;
			readonly params: Readonly<Record<string, unknown>>;
	  };

export interface ExecutionPlan {
	readonly graph: RuntimeGraph;
	readonly definition: GraphDefinition;
	/** Topologically sorted node IDs. */
	readonly order: ReadonlyArray<string>;
}

/**
 * Build an execution plan from a validated graph:
 * 1. Compute topological order via graphology-dag `topologicalSort`
 * 2. Resolve every action/provider name against the Registry
 * 3. Store resolved references as node attributes on the RuntimeGraph
 */
export const buildPlan = (
	validated: ParsedGraph,
	registry: Registry,
): ExecutionPlan => {
	const { definition, graph } = validated;

	const order = topologicalSort(graph);

	for (const node of definition.nodes) {
		switch (node.type) {
			case "source": {
				const provider = registry.getProvider(node.provider);
				graph.setNodeAttribute(node.id, "resolved", {
					type: "source",
					provider,
					params: node.params as Readonly<Record<string, unknown>>,
				});
				break;
			}
			case "target": {
				const provider = registry.getProvider(node.provider);
				graph.setNodeAttribute(node.id, "resolved", {
					type: "target",
					provider,
					params: node.params as Readonly<Record<string, unknown>>,
				});
				break;
			}
			case "action": {
				const action = registry.getAction(node.action);
				graph.setNodeAttribute(node.id, "resolved", {
					type: "action",
					action,
					params: node.params as Readonly<Record<string, unknown>>,
				});
				break;
			}
		}
	}

	logger.debug("Execution plan built", {
		graphId: definition.id,
		order: order.join(" → "),
	});

	return { graph, definition, order };
};
