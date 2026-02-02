import { getLogger } from "@logtape/logtape";
import { topologicalSort } from "graphology-dag";
import type { AnyActionInstance, AnyProviderFactory } from "@nvisy/core";
import type { GraphDefinition } from "../schema/index.js";
import type { Registry } from "../registry/index.js";
import type { RuntimeGraph, ParsedGraph } from "./parse.js";

const logger = getLogger(["nvisy", "compiler"]);

/**
 * A resolved reference to a registry entry, carried alongside the
 * node so the engine never needs to look things up at execution time.
 */
export type ResolvedNode =
	| { readonly type: "source"; readonly provider: AnyProviderFactory; readonly config: Readonly<Record<string, unknown>> }
	| { readonly type: "action"; readonly action: AnyActionInstance; readonly config: Readonly<Record<string, unknown>> }
	| { readonly type: "target"; readonly provider: AnyProviderFactory; readonly config: Readonly<Record<string, unknown>> }
	| { readonly type: "branch" };

export interface ExecutionPlan {
	readonly graph: RuntimeGraph;
	readonly definition: GraphDefinition;
	/** Topologically sorted node IDs. */
	readonly order: ReadonlyArray<string>;
}

/**
 * Build an execution plan from a validated graph:
 * 1. Compute topological order via graphology-dag `topologicalSort`
 * 2. Resolve every action/connector name against the Registry
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
				const provider = registry.getProvider(node.connector);
				graph.setNodeAttribute(node.id, "resolved", { type: "source", provider, config: node.config as Readonly<Record<string, unknown>> });
				break;
			}
			case "target": {
				const provider = registry.getProvider(node.connector);
				graph.setNodeAttribute(node.id, "resolved", { type: "target", provider, config: node.config as Readonly<Record<string, unknown>> });
				break;
			}
			case "action": {
				const action = registry.getAction(node.action);
				graph.setNodeAttribute(node.id, "resolved", { type: "action", action, config: node.config as Readonly<Record<string, unknown>> });
				break;
			}
			default:
				graph.setNodeAttribute(node.id, "resolved", { type: "branch" });
		}
	}

	logger.debug("Execution plan built", {
		graphId: definition.id,
		order: order.join(" → "),
	});

	return { graph, definition, order };
};
