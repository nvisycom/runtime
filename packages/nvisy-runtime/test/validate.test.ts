import { describe, expect, it } from "vitest";
import { parseGraph } from "../src/compiler/parse.js";
import { validateGraph } from "../src/compiler/validate.js";
import {
	ACTION_ID,
	diamondGraph,
	GRAPH_ID,
	linearGraph,
	makeTestRegistry,
	SOURCE_ID,
	TARGET_ID,
} from "./fixtures.js";

describe("validateGraph", () => {
	it("validates a correct linear graph", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(linearGraph());
		const result = validateGraph(parsed, registry);

		expect(result.definition.id).toBe(GRAPH_ID);
		expect(result.graph.order).toBe(3);
	});

	it("validates a diamond graph", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(diamondGraph());
		const result = validateGraph(parsed, registry);

		expect(result.graph.order).toBe(4);
		expect(result.graph.size).toBe(4);
	});

	it("rejects duplicate node IDs (caught by graphology during parse)", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					params: { host: "localhost", table: "t" },
				},
				{ id: SOURCE_ID, type: "action", action: "test/noop", params: {} },
			],
		};

		// graphology throws when adding a duplicate node
		expect(() => {
			const parsed = parseGraph(input);
			validateGraph(parsed, registry);
		}).toThrow("already exist");
	});

	it("rejects dangling edge.from references (caught by graphology during parse)", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					params: { host: "localhost", table: "t" },
				},
			],
			edges: [{ from: ACTION_ID, to: SOURCE_ID }],
		};

		expect(() => {
			const parsed = parseGraph(input);
			validateGraph(parsed, registry);
		}).toThrow("not found");
	});

	it("rejects dangling edge.to references (caught by graphology during parse)", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					params: { host: "localhost", table: "t" },
				},
			],
			edges: [{ from: SOURCE_ID, to: ACTION_ID }],
		};

		expect(() => {
			const parsed = parseGraph(input);
			validateGraph(parsed, registry);
		}).toThrow("not found");
	});

	it("rejects graphs with cycles", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "action", action: "test/noop", params: {} },
				{ id: ACTION_ID, type: "action", action: "test/noop", params: {} },
				{ id: TARGET_ID, type: "action", action: "test/noop", params: {} },
			],
			edges: [
				{ from: SOURCE_ID, to: ACTION_ID },
				{ from: ACTION_ID, to: TARGET_ID },
				{ from: TARGET_ID, to: SOURCE_ID },
			],
		};

		const parsed = parseGraph(input);
		expect(() => validateGraph(parsed, registry)).toThrow(
			"Graph contains a cycle",
		);
	});

	it("rejects unresolved action names", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: ACTION_ID,
					type: "action",
					action: "nonexistent/action",
					params: {},
				},
			],
		};

		const parsed = parseGraph(input);
		expect(() => validateGraph(parsed, registry)).toThrow("Unresolved names");
	});

	it("rejects unresolved provider names", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "nonexistent/provider",
					params: { key: "val" },
				},
			],
		};

		const parsed = parseGraph(input);
		expect(() => validateGraph(parsed, registry)).toThrow("Unresolved names");
	});

	it("passes validation for an empty graph", () => {
		const registry = makeTestRegistry();
		const input = { id: GRAPH_ID, nodes: [] };

		const parsed = parseGraph(input);
		const result = validateGraph(parsed, registry);

		expect(result.definition.nodes).toHaveLength(0);
		expect(result.graph.order).toBe(0);
	});
});
