import { describe, expect, it } from "vitest";
import { parseGraph } from "../src/compiler/parse.js";
import {
	ACTION_ID,
	CRED_ID,
	GRAPH_ID,
	linearGraph,
	SOURCE_ID,
	TARGET_ID,
} from "./fixtures.js";

describe("parseGraph", () => {
	it("parses a valid linear graph", () => {
		const result = parseGraph(linearGraph());

		expect(result.definition.id).toBe(GRAPH_ID);
		expect(result.definition.nodes).toHaveLength(3);
		expect(result.definition.edges).toHaveLength(2);
		expect(result.graph.order).toBe(3);
		expect(result.graph.size).toBe(2);
	});

	it("returns a RuntimeGraph with correct node attributes", () => {
		const result = parseGraph(linearGraph());

		const attrs = result.graph.getNodeAttributes(SOURCE_ID);
		expect(attrs.schema.type).toBe("source");
	});

	it("creates edge keys in from->to format", () => {
		const result = parseGraph(linearGraph());

		expect(result.graph.hasEdge(`${SOURCE_ID}->${ACTION_ID}`)).toBe(true);
		expect(result.graph.hasEdge(`${ACTION_ID}->${TARGET_ID}`)).toBe(true);
	});

	it("rejects input missing required fields", () => {
		expect(() => parseGraph({})).toThrow("Graph parse error");
	});

	it("rejects non-UUID node IDs", () => {
		const bad = {
			id: GRAPH_ID,
			nodes: [
				{ id: "not-a-uuid", type: "action", action: "test/noop", params: {} },
			],
		};

		expect(() => parseGraph(bad)).toThrow("Graph parse error");
	});

	it("rejects non-UUID graph ID", () => {
		const bad = {
			id: "bad-graph-id",
			nodes: [],
		};

		expect(() => parseGraph(bad)).toThrow("Graph parse error");
	});

	it("defaults edges to empty array", () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "x",
					stream: "x/read",
					connection: CRED_ID,
					params: { key: "val" },
				},
			],
		};

		const result = parseGraph(input);
		expect(result.definition.edges).toEqual([]);
		expect(result.graph.size).toBe(0);
	});

	it("defaults metadata to empty object", () => {
		const input = {
			id: GRAPH_ID,
			nodes: [],
		};

		const result = parseGraph(input);
		expect(result.definition.metadata).toEqual({});
	});

	it("rejects duplicate node IDs (caught by graphology during parse)", () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					stream: "test/read",
					connection: CRED_ID,
					params: { table: "t" },
				},
				{ id: SOURCE_ID, type: "action", action: "test/noop", params: {} },
			],
		};

		expect(() => parseGraph(input)).toThrow("already exist");
	});

	it("rejects dangling edge.from references (caught by graphology during parse)", () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					stream: "test/read",
					connection: CRED_ID,
					params: { table: "t" },
				},
			],
			edges: [{ from: ACTION_ID, to: SOURCE_ID }],
		};

		expect(() => parseGraph(input)).toThrow("not found");
	});

	it("rejects dangling edge.to references (caught by graphology during parse)", () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					stream: "test/read",
					connection: CRED_ID,
					params: { table: "t" },
				},
			],
			edges: [{ from: SOURCE_ID, to: ACTION_ID }],
		};

		expect(() => parseGraph(input)).toThrow("not found");
	});
});

describe("buildRuntimeGraph", () => {
	it("builds a graph matching the definition", () => {
		const { graph } = parseGraph({
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source" as const,
					provider: "x",
					stream: "x/read",
					connection: CRED_ID,
					params: { k: "v" },
				},
				{ id: ACTION_ID, type: "action" as const, action: "y", params: {} },
			],
			edges: [{ from: SOURCE_ID, to: ACTION_ID }],
		});

		expect(graph.order).toBe(2);
		expect(graph.size).toBe(1);
		expect(graph.hasNode(SOURCE_ID)).toBe(true);
		expect(graph.hasNode(ACTION_ID)).toBe(true);
		expect(graph.hasEdge(`${SOURCE_ID}->${ACTION_ID}`)).toBe(true);
		expect(graph.source(`${SOURCE_ID}->${ACTION_ID}`)).toBe(SOURCE_ID);
		expect(graph.target(`${SOURCE_ID}->${ACTION_ID}`)).toBe(ACTION_ID);
	});
});
