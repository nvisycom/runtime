import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { parseGraph, buildRuntimeGraph } from "../src/compiler/parse.js";
import {
	GRAPH_ID, SOURCE_ID, ACTION_ID, TARGET_ID,
	linearGraph,
} from "./fixtures.js";

const run = <A>(effect: Effect.Effect<A, Error>): Promise<A> =>
	Effect.runPromise(effect);

describe("parseGraph", () => {
	it("parses a valid linear graph", async () => {
		const result = await run(parseGraph(linearGraph()));

		expect(result.definition.id).toBe(GRAPH_ID);
		expect(result.definition.nodes).toHaveLength(3);
		expect(result.definition.edges).toHaveLength(2);
		expect(result.graph.order).toBe(3);
		expect(result.graph.size).toBe(2);
	});

	it("returns a RuntimeGraph with correct node attributes", async () => {
		const result = await run(parseGraph(linearGraph()));

		const attrs = result.graph.getNodeAttributes(SOURCE_ID);
		expect(attrs.schema.type).toBe("source");
		expect(attrs.resolved).toBeUndefined();
	});

	it("creates edge keys in from->to format", async () => {
		const result = await run(parseGraph(linearGraph()));

		expect(result.graph.hasEdge(`${SOURCE_ID}->${ACTION_ID}`)).toBe(true);
		expect(result.graph.hasEdge(`${ACTION_ID}->${TARGET_ID}`)).toBe(true);
	});

	it("rejects input missing required fields", async () => {
		await expect(run(parseGraph({}))).rejects.toThrow("Graph parse error");
	});

	it("rejects non-UUID node IDs", async () => {
		const bad = {
			id: GRAPH_ID,
			nodes: [
				{ id: "not-a-uuid", type: "action", action: "test/noop", config: {} },
			],
		};

		await expect(run(parseGraph(bad))).rejects.toThrow("Graph parse error");
	});

	it("rejects non-UUID graph ID", async () => {
		const bad = {
			id: "bad-graph-id",
			nodes: [],
		};

		await expect(run(parseGraph(bad))).rejects.toThrow("Graph parse error");
	});

	it("defaults edges to empty array", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source", connector: "x", config: { key: "val" } },
			],
		};

		const result = await run(parseGraph(input));
		expect(result.definition.edges).toEqual([]);
		expect(result.graph.size).toBe(0);
	});

	it("defaults metadata to empty object", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [],
		};

		const result = await run(parseGraph(input));
		expect(result.definition.metadata).toEqual({});
	});
});

describe("buildRuntimeGraph", () => {
	it("builds a graph matching the definition", () => {
		const def = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source" as const, connector: "x", config: { k: "v" } },
				{ id: ACTION_ID, type: "action" as const, action: "y", config: {} },
			],
			edges: [{ from: SOURCE_ID, to: ACTION_ID }],
			metadata: {},
		};

		// buildRuntimeGraph requires the full decoded type; we cast here
		// because we're testing the graph construction, not schema validation
		const graph = buildRuntimeGraph(def as any);

		expect(graph.order).toBe(2);
		expect(graph.size).toBe(1);
		expect(graph.hasNode(SOURCE_ID)).toBe(true);
		expect(graph.hasNode(ACTION_ID)).toBe(true);
		expect(graph.hasEdge(`${SOURCE_ID}->${ACTION_ID}`)).toBe(true);
		expect(graph.source(`${SOURCE_ID}->${ACTION_ID}`)).toBe(SOURCE_ID);
		expect(graph.target(`${SOURCE_ID}->${ACTION_ID}`)).toBe(ACTION_ID);
	});
});
