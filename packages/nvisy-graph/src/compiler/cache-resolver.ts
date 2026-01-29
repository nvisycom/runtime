import type { Edge } from "../definition/edge.js";
import type { WorkflowDefinition } from "../definition/workflow.js";

/**
 * Resolves cache slot connections by replacing cache_slot input/output nodes
 * with direct edges from writers to readers.
 */
export function resolveCacheSlots(def: WorkflowDefinition): Edge[] {
	const nodeEntries = Object.entries(def.nodes);

	// Identify cache output nodes (writers) by slot name
	const writersBySlot = new Map<string, string[]>();
	for (const [id, node] of nodeEntries) {
		if (
			node.kind.type === "output" &&
			node.kind.config.target === "cache_slot"
		) {
			const slot = node.kind.config.slot;
			const existing = writersBySlot.get(slot);
			if (existing === undefined) {
				writersBySlot.set(slot, [id]);
			} else {
				existing.push(id);
			}
		}
	}

	// Identify cache input nodes (readers) by slot name
	const readersBySlot = new Map<string, string[]>();
	for (const [id, node] of nodeEntries) {
		if (
			node.kind.type === "input" &&
			node.kind.config.source === "cache_slot"
		) {
			const slot = node.kind.config.slot;
			const existing = readersBySlot.get(slot);
			if (existing === undefined) {
				readersBySlot.set(slot, [id]);
			} else {
				existing.push(id);
			}
		}
	}

	// Collect all cache node IDs
	const cacheNodeIds = new Set<string>();
	for (const ids of writersBySlot.values()) {
		for (const id of ids) cacheNodeIds.add(id);
	}
	for (const ids of readersBySlot.values()) {
		for (const id of ids) cacheNodeIds.add(id);
	}

	// Find predecessors of writer nodes (nodes that feed into cache output)
	const writerPredecessors = new Map<string, Edge[]>();
	for (const edge of def.edges) {
		const toStr = String(edge.to);
		if (cacheNodeIds.has(toStr)) {
			const slot = getSlotForNode(def, toStr);
			if (typeof slot === "string" && writersBySlot.has(slot)) {
				const existing = writerPredecessors.get(toStr);
				if (existing === undefined) {
					writerPredecessors.set(toStr, [edge]);
				} else {
					existing.push(edge);
				}
			}
		}
	}

	// Find successors of reader nodes (nodes that read from cache input)
	const readerSuccessors = new Map<string, Edge[]>();
	for (const edge of def.edges) {
		const fromStr = String(edge.from);
		if (cacheNodeIds.has(fromStr)) {
			const slot = getSlotForNode(def, fromStr);
			if (typeof slot === "string" && readersBySlot.has(slot)) {
				const existing = readerSuccessors.get(fromStr);
				if (existing === undefined) {
					readerSuccessors.set(fromStr, [edge]);
				} else {
					existing.push(edge);
				}
			}
		}
	}

	// Build resolved edges: keep non-cache edges and add bridging edges
	const resolvedEdges: Edge[] = [];

	// Keep edges that do not touch cache nodes
	for (const edge of def.edges) {
		const fromStr = String(edge.from);
		const toStr = String(edge.to);
		if (
			cacheNodeIds.has(fromStr) === false &&
			cacheNodeIds.has(toStr) === false
		) {
			resolvedEdges.push(edge);
		}
	}

	// Create bridging edges for each slot
	for (const [slot, writerIds] of writersBySlot) {
		const readerIds = readersBySlot.get(slot);
		if (readerIds === undefined) continue;

		for (const writerId of writerIds) {
			const predecessors = writerPredecessors.get(writerId) ?? [];
			for (const readerId of readerIds) {
				const successors = readerSuccessors.get(readerId) ?? [];
				for (const pred of predecessors) {
					for (const succ of successors) {
						resolvedEdges.push({
							from: pred.from,
							to: succ.to,
							fromPort: pred.fromPort,
							toPort: succ.toPort,
						});
					}
				}
			}
		}
	}

	return resolvedEdges;
}

function getSlotForNode(
	def: WorkflowDefinition,
	nodeId: string,
): string | null {
	const node = def.nodes[nodeId];
	if (node === undefined) return null;
	if (node.kind.type === "output" && node.kind.config.target === "cache_slot") {
		return node.kind.config.slot;
	}
	if (node.kind.type === "input" && node.kind.config.source === "cache_slot") {
		return node.kind.config.slot;
	}
	return null;
}
