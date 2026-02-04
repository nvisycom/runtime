import { getLogger } from "@logtape/logtape";
import type {
	AnyActionInstance,
	AnyProviderFactory,
	AnyStreamSource,
	AnyStreamTarget,
} from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { hasCycle, topologicalSort } from "graphology-dag";
import type { Registry } from "../registry.js";
import type { Graph, GraphNode } from "../schema.js";
import type { ParsedGraph, RuntimeGraph } from "./parse.js";

const logger = getLogger(["nvisy", "compiler"]);

/** Resolved source node with provider and stream references. */
export interface ResolvedSourceNode {
	readonly type: "source";
	readonly provider: AnyProviderFactory;
	readonly stream: AnyStreamSource;
	readonly connection: string;
	readonly params: Readonly<Record<string, unknown>>;
}

/** Resolved action node with action reference. */
export interface ResolvedActionNode {
	readonly type: "action";
	readonly action: AnyActionInstance;
	readonly provider?: AnyProviderFactory;
	readonly connection?: string;
	readonly params: Readonly<Record<string, unknown>>;
}

/** Resolved target node with provider and stream references. */
export interface ResolvedTargetNode {
	readonly type: "target";
	readonly provider: AnyProviderFactory;
	readonly stream: AnyStreamTarget;
	readonly connection: string;
	readonly params: Readonly<Record<string, unknown>>;
}

/** A resolved registry entry carried with the node for execution. */
export type ResolvedNode =
	| ResolvedSourceNode
	| ResolvedActionNode
	| ResolvedTargetNode;

/** Compiled graph ready for execution. */
export interface ExecutionPlan {
	/** The graphology graph with node attributes. */
	readonly graph: RuntimeGraph;
	/** The original parsed graph definition. */
	readonly definition: Graph;
	/** Topologically sorted node IDs. */
	readonly order: ReadonlyArray<string>;
	/** Resolved registry entries keyed by node ID. */
	readonly resolved: ReadonlyMap<string, ResolvedNode>;
}

/** Build an execution plan from a parsed graph. */
export const buildPlan = (
	parsed: ParsedGraph,
	registry: Registry,
): ExecutionPlan => {
	const { definition, graph } = parsed;

	checkForCycles(graph, definition.id);
	const resolved = resolveAllNodes(definition.nodes, registry, definition.id);
	const order = topologicalSort(graph);

	logger.debug("Execution plan built", {
		graphId: definition.id,
		order: order.join(" → "),
	});

	return { graph, definition, order, resolved };
};

function checkForCycles(graph: RuntimeGraph, graphId: string): void {
	if (hasCycle(graph)) {
		logger.warn("Graph contains a cycle", { graphId });
		throw new ValidationError("Graph contains a cycle", {
			source: "compiler",
			retryable: false,
		});
	}
}

function resolveAllNodes(
	nodes: ReadonlyArray<GraphNode>,
	registry: Registry,
	graphId: string,
): Map<string, ResolvedNode> {
	const resolved = new Map<string, ResolvedNode>();
	const unresolved: string[] = [];

	for (const node of nodes) {
		const entry = resolveNode(node, registry, unresolved);
		if (entry) {
			resolved.set(node.id, entry);
		}
	}

	if (unresolved.length > 0) {
		logger.warn("Unresolved names: {names}", {
			graphId,
			names: unresolved.join(", "),
		});
		throw new ValidationError(`Unresolved names: ${unresolved.join(", ")}`, {
			source: "compiler",
			retryable: false,
		});
	}

	return resolved;
}

function resolveNode(
	node: GraphNode,
	registry: Registry,
	unresolved: string[],
): ResolvedNode | undefined {
	switch (node.type) {
		case "source": {
			const provider = registry.findProvider(node.provider);
			const stream = registry.findStream(node.stream) as
				| AnyStreamSource
				| undefined;
			if (!provider) {
				unresolved.push(`provider "${node.provider}" (node ${node.id})`);
			}
			if (!stream) {
				unresolved.push(`stream "${node.stream}" (node ${node.id})`);
			}
			if (provider && stream) {
				return {
					type: "source",
					provider,
					stream,
					connection: node.connection,
					params: node.params as Readonly<Record<string, unknown>>,
				};
			}
			return undefined;
		}
		case "target": {
			const provider = registry.findProvider(node.provider);
			const stream = registry.findStream(node.stream) as
				| AnyStreamTarget
				| undefined;
			if (!provider) {
				unresolved.push(`provider "${node.provider}" (node ${node.id})`);
			}
			if (!stream) {
				unresolved.push(`stream "${node.stream}" (node ${node.id})`);
			}
			if (provider && stream) {
				return {
					type: "target",
					provider,
					stream,
					connection: node.connection,
					params: node.params as Readonly<Record<string, unknown>>,
				};
			}
			return undefined;
		}
		case "action": {
			const action = registry.findAction(node.action);
			if (!action) {
				unresolved.push(`action "${node.action}" (node ${node.id})`);
				return undefined;
			}

			if (node.provider) {
				const provider = registry.findProvider(node.provider);
				if (!provider) {
					unresolved.push(`provider "${node.provider}" (node ${node.id})`);
					return undefined;
				}

				return {
					type: "action",
					action,
					provider,
					...(node.connection != null ? { connection: node.connection } : {}),
					params: node.params as Readonly<Record<string, unknown>>,
				};
			}

			return {
				type: "action",
				action,
				params: node.params as Readonly<Record<string, unknown>>,
			};
		}
	}
}
