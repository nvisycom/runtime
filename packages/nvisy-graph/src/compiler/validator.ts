import { InvalidDefinitionError } from "@nvisy/core";
import type { WorkflowDefinition } from "../definition/workflow.js";

/**
 * Detects whether the workflow definition contains a cycle using Kahn algorithm.
 */
export function hasCycle(def: WorkflowDefinition): boolean {
	const nodeIds = Object.keys(def.nodes);
	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();

	for (const id of nodeIds) {
		inDegree.set(id, 0);
		adjacency.set(id, []);
	}

	for (const edge of def.edges) {
		const fromStr = String(edge.from);
		const toStr = String(edge.to);
		const current = inDegree.get(toStr);
		if (current === undefined) continue;
		inDegree.set(toStr, current + 1);
		adjacency.get(fromStr)?.push(toStr);
	}

	const queue: string[] = [];
	for (const [id, degree] of inDegree) {
		if (degree === 0) {
			queue.push(id);
		}
	}

	let visited = 0;
	while (queue.length > 0) {
		const current = queue.shift() as string;
		visited++;

		for (const neighbor of adjacency.get(current) ?? []) {
			const deg = inDegree.get(neighbor) as number;
			const newDeg = deg - 1;
			inDegree.set(neighbor, newDeg);
			if (newDeg === 0) {
				queue.push(neighbor);
			}
		}
	}

	return visited !== nodeIds.length;
}

/**
 * Validates a workflow definition:
 * 1. All edges reference existing nodes
 * 2. At least one input node exists
 * 3. At least one output node exists
 * 4. No cycles (Kahn algorithm)
 */
export function validateWorkflow(def: WorkflowDefinition): void {
	const nodeIds = new Set(Object.keys(def.nodes));

	// 1. Check edges reference existing nodes
	for (const edge of def.edges) {
		const fromStr = String(edge.from);
		const toStr = String(edge.to);
		if (nodeIds.has(fromStr) === false) {
			throw new InvalidDefinitionError(
				`Edge references non-existent source node: ${fromStr}`,
			);
		}
		if (nodeIds.has(toStr) === false) {
			throw new InvalidDefinitionError(
				`Edge references non-existent target node: ${toStr}`,
			);
		}
	}

	// 2. At least one input node
	const hasInput = Object.values(def.nodes).some(
		(node) => node.kind.type === "input",
	);
	if (hasInput === false) {
		throw new InvalidDefinitionError(
			"Workflow must have at least one input node",
		);
	}

	// 3. At least one output node
	const hasOutput = Object.values(def.nodes).some(
		(node) => node.kind.type === "output",
	);
	if (hasOutput === false) {
		throw new InvalidDefinitionError(
			"Workflow must have at least one output node",
		);
	}

	// 4. No cycles
	if (hasCycle(def)) {
		throw new InvalidDefinitionError("Workflow definition contains a cycle");
	}
}
