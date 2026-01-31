import { Effect } from "effect";
import { topologicalSort } from "graphology-dag";
import type { AnyActionInstance, AnyProviderFactory } from "@nvisy/core";
import type { GraphDefinition } from "../schema/index.js";
import { Registry } from "../registry/index.js";
import type { RuntimeGraph, ParsedGraph } from "./parse.js";

/**
 * A resolved reference to a registry entry, carried alongside the
 * node so the engine never needs to look things up at execution time.
 */
export type ResolvedNode =
	| { readonly type: "source"; readonly provider: AnyProviderFactory; readonly config: Readonly<Record<string, unknown>> }
	| { readonly type: "action"; readonly action: AnyActionInstance; readonly config: Readonly<Record<string, unknown>> }
	| { readonly type: "sink"; readonly provider: AnyProviderFactory; readonly config: Readonly<Record<string, unknown>> }
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
): Effect.Effect<ExecutionPlan, Error, Registry> =>
	Effect.gen(function* () {
		const registry = yield* Registry;
		const { definition, graph } = validated;

		// ── Topological sort ──────────────────────────────────────────
		const order = topologicalSort(graph);

		// ── Resolve names & store as node attributes ──────────────────
		for (const node of definition.nodes) {
			switch (node.type) {
				case "source": {
					const provider = yield* registry.getProvider(node.connector);
					graph.setNodeAttribute(node.id, "resolved", { type: "source", provider, config: node.config as Readonly<Record<string, unknown>> });
					break;
				}
				case "sink": {
					const provider = yield* registry.getProvider(node.connector);
					graph.setNodeAttribute(node.id, "resolved", { type: "sink", provider, config: node.config as Readonly<Record<string, unknown>> });
					break;
				}
				case "action": {
					const action = yield* registry.getAction(node.action);
					graph.setNodeAttribute(node.id, "resolved", { type: "action", action, config: node.config as Readonly<Record<string, unknown>> });
					break;
				}
				default:
					graph.setNodeAttribute(node.id, "resolved", { type: "branch" });
			}
		}

		yield* Effect.logDebug("Execution plan built")
			.pipe(Effect.annotateLogs({
				graphId: definition.id,
				order: order.join(" → "),
			}));

		return { graph, definition, order };
	});
