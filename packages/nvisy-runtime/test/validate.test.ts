import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { parseGraph } from "../src/compiler/parse.js";
import { validateGraph } from "../src/compiler/validate.js";
import {
	GRAPH_ID, SOURCE_ID, ACTION_ID, SINK_ID,
	linearGraph, diamondGraph, runWithRegistry,
} from "./fixtures.js";

describe("validateGraph", () => {
	it("validates a correct linear graph", async () => {
		const result = await runWithRegistry(
			parseGraph(linearGraph()).pipe(Effect.flatMap(validateGraph)),
		);

		expect(result.definition.id).toBe(GRAPH_ID);
		expect(result.graph.order).toBe(3);
	});

	it("validates a diamond graph", async () => {
		const result = await runWithRegistry(
			parseGraph(diamondGraph()).pipe(Effect.flatMap(validateGraph)),
		);

		expect(result.graph.order).toBe(4);
		expect(result.graph.size).toBe(4);
	});

	it("rejects duplicate node IDs (caught by graphology during parse)", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source", connector: "test/testdb", config: { host: "localhost", table: "t" } },
				{ id: SOURCE_ID, type: "action", action: "test/noop", config: {} },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("already exist");
	});

	it("rejects dangling edge.from references (caught by graphology during parse)", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source", connector: "test/testdb", config: { host: "localhost", table: "t" } },
			],
			edges: [
				{ from: ACTION_ID, to: SOURCE_ID },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("not found");
	});

	it("rejects dangling edge.to references (caught by graphology during parse)", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source", connector: "test/testdb", config: { host: "localhost", table: "t" } },
			],
			edges: [
				{ from: SOURCE_ID, to: ACTION_ID },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("not found");
	});

	it("rejects graphs with cycles", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "action", action: "test/noop", config: {} },
				{ id: ACTION_ID, type: "action", action: "test/noop", config: {} },
				{ id: SINK_ID, type: "action", action: "test/noop", config: {} },
			],
			edges: [
				{ from: SOURCE_ID, to: ACTION_ID },
				{ from: ACTION_ID, to: SINK_ID },
				{ from: SINK_ID, to: SOURCE_ID },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("Graph contains a cycle");
	});

	it("rejects unresolved action names", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: ACTION_ID, type: "action", action: "nonexistent/action", config: {} },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("Unresolved names");
	});

	it("rejects unresolved provider names", async () => {
		const input = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "source", connector: "nonexistent/provider", config: { key: "val" } },
			],
		};

		await expect(
			runWithRegistry(parseGraph(input).pipe(Effect.flatMap(validateGraph))),
		).rejects.toThrow("Unresolved names");
	});

	it("passes validation for an empty graph", async () => {
		const input = { id: GRAPH_ID, nodes: [] };

		const result = await runWithRegistry(
			parseGraph(input).pipe(Effect.flatMap(validateGraph)),
		);

		expect(result.definition.nodes).toHaveLength(0);
		expect(result.graph.order).toBe(0);
	});
});
