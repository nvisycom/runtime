import { getLogger } from "@logtape/logtape";
import { hasCycle } from "graphology-dag";
import type { Registry } from "../registry/index.js";
import type { GraphNode } from "../schema/index.js";
import type { ParsedGraph } from "./parse.js";

const logger = getLogger(["nvisy", "compiler"]);

/**
 * Validate a parsed graph:
 * 1. No duplicate node IDs
 * 2. No dangling edge references
 * 3. No cycles (via graphology-dag `hasCycle`)
 * 4. Every action/provider name resolves in the Registry
 */
export const validateGraph = (
	parsed: ParsedGraph,
	registry: Registry,
): ParsedGraph => {
	const { definition, graph } = parsed;
	const nodeIds = new Set(definition.nodes.map((n) => n.id));

	if (nodeIds.size !== definition.nodes.length) {
		const seen = new Set<string>();
		const dupes: string[] = [];
		for (const n of definition.nodes) {
			if (seen.has(n.id)) dupes.push(n.id);
			seen.add(n.id);
		}
		logger.warn("Duplicate node IDs: {dupes}", {
			graphId: definition.id,
			dupes: dupes.join(", "),
		});
		throw new Error(`Duplicate node IDs: ${dupes.join(", ")}`);
	}

	const dangling: string[] = [];
	for (const edge of definition.edges) {
		if (!nodeIds.has(edge.from)) {
			dangling.push(`edge.from "${edge.from}"`);
		}
		if (!nodeIds.has(edge.to)) {
			dangling.push(`edge.to "${edge.to}"`);
		}
	}
	if (dangling.length > 0) {
		logger.warn("Dangling edge references: {refs}", {
			graphId: definition.id,
			refs: dangling.join(", "),
		});
		throw new Error(`Dangling edge references: ${dangling.join(", ")}`);
	}

	if (hasCycle(graph)) {
		logger.warn("Graph contains a cycle", { graphId: definition.id });
		throw new Error("Graph contains a cycle");
	}

	const unresolved: string[] = [];
	for (const node of definition.nodes) {
		resolveNodeNames(node, registry, unresolved);
	}
	if (unresolved.length > 0) {
		logger.warn("Unresolved names: {names}", {
			graphId: definition.id,
			names: unresolved.join(", "),
		});
		throw new Error(`Unresolved names: ${unresolved.join(", ")}`);
	}

	logger.debug("Graph validated", {
		graphId: definition.id,
		nodes: String(definition.nodes.length),
	});

	return { definition, graph };
};

function resolveNodeNames(
	node: GraphNode,
	registry: Registry,
	unresolved: string[],
): void {
	switch (node.type) {
		case "source":
		case "target":
			try {
				registry.getProvider(node.provider);
			} catch {
				unresolved.push(`provider "${node.provider}" (node ${node.id})`);
			}
			break;
		case "action":
			try {
				registry.getAction(node.action);
			} catch {
				unresolved.push(`action "${node.action}" (node ${node.id})`);
			}
			break;
	}
}
