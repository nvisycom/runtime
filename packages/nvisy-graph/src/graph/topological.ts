/**
 * Topological sort using Kahn algorithm (in-degree based).
 * Returns sorted array of node IDs, or null if a cycle is detected.
 */
export function topologicalSort(
	nodeIds: string[],
	edges: Array<{ from: string; to: string }>,
): string[] | null {
	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();

	for (const id of nodeIds) {
		inDegree.set(id, 0);
		adjacency.set(id, []);
	}

	for (const edge of edges) {
		const current = inDegree.get(edge.to);
		if (current === undefined) continue;
		inDegree.set(edge.to, current + 1);
		adjacency.get(edge.from)?.push(edge.to);
	}

	const queue: string[] = [];
	for (const [id, degree] of inDegree) {
		if (degree === 0) {
			queue.push(id);
		}
	}

	const sorted: string[] = [];

	while (queue.length > 0) {
		const current = queue.shift() as string;
		sorted.push(current);

		for (const neighbor of adjacency.get(current) ?? []) {
			const deg = inDegree.get(neighbor) as number;
			const newDeg = deg - 1;
			inDegree.set(neighbor, newDeg);
			if (newDeg === 0) {
				queue.push(neighbor);
			}
		}
	}

	if (sorted.length === nodeIds.length) {
		return sorted;
	}

	return null;
}
