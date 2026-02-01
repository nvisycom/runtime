import { Effect } from "effect";
import { hasCycle } from "graphology-dag";
import type { GraphNode } from "../schema/index.js";
import { Registry } from "../registry/index.js";
import type { ParsedGraph } from "./parse.js";

/**
 * Validate a parsed graph:
 * 1. No duplicate node IDs
 * 2. No dangling edge references
 * 3. No cycles (via graphology-dag `hasCycle`)
 * 4. Every action/connector name resolves in the Registry
 */
export const validateGraph = (
	parsed: ParsedGraph,
): Effect.Effect<ParsedGraph, Error, Registry> =>
	Effect.gen(function* () {
		const registry = yield* Registry;
		const { definition, graph } = parsed;
		const nodeIds = new Set(definition.nodes.map((n) => n.id));

		// ── Duplicate IDs ──────────────────────────────────────────────
		if (nodeIds.size !== definition.nodes.length) {
			const seen = new Set<string>();
			const dupes: string[] = [];
			for (const n of definition.nodes) {
				if (seen.has(n.id)) dupes.push(n.id);
				seen.add(n.id);
			}
			return yield* Effect.fail(
				new Error(`Duplicate node IDs: ${dupes.join(", ")}`),
			);
		}

		// ── Dangling edge references ──────────────────────────────────
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
			return yield* Effect.fail(
				new Error(`Dangling edge references: ${dangling.join(", ")}`),
			);
		}

		// ── Cycle detection ───────────────────────────────────────────
		if (hasCycle(graph)) {
			return yield* Effect.fail(
				new Error("Graph contains a cycle"),
			);
		}

		// ── Name resolution ────────────────────────────────────────────
		const unresolved: string[] = [];
		for (const node of definition.nodes) {
			yield* resolveNodeNames(node, registry, unresolved);
		}
		if (unresolved.length > 0) {
			return yield* Effect.fail(
				new Error(`Unresolved names: ${unresolved.join(", ")}`),
			);
		}

		yield* Effect.logDebug("Graph validated")
			.pipe(Effect.annotateLogs({ graphId: definition.id, nodes: String(definition.nodes.length) }));

		return { definition, graph };
	});

function resolveNodeNames(
	node: GraphNode,
	registry: Effect.Effect.Success<typeof Registry>,
	unresolved: string[],
): Effect.Effect<void> {
	switch (node.type) {
		case "source":
		case "target":
			return registry.getProvider(node.connector).pipe(
				Effect.map(() => undefined),
				Effect.catchAll(() => Effect.sync(() => {
					unresolved.push(`provider "${node.connector}" (node ${node.id})`);
				})),
			);
		case "action":
			return registry.getAction(node.action).pipe(
				Effect.map(() => undefined),
				Effect.catchAll(() => Effect.sync(() => {
					unresolved.push(`action "${node.action}" (node ${node.id})`);
				})),
			);
		default:
			return Effect.void;
	}
}
