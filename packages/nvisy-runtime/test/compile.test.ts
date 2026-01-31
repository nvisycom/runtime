import { describe, it, expect } from "vitest";
import { compile } from "../src/compiler/index.js";
import {
	GRAPH_ID, SOURCE_ID, ACTION_ID, SINK_ID,
	linearGraph, diamondGraph, runWithRegistry,
} from "./fixtures.js";

describe("compile", () => {
	it("compiles a valid linear graph end-to-end", async () => {
		const plan = await runWithRegistry(compile(linearGraph()));

		expect(plan.definition.id).toBe(GRAPH_ID);
		expect(plan.order).toEqual([SOURCE_ID, ACTION_ID, SINK_ID]);
		expect(plan.graph.order).toBe(3);
		expect(plan.graph.size).toBe(2);
	});

	it("compiles a diamond graph end-to-end", async () => {
		const plan = await runWithRegistry(compile(diamondGraph()));

		expect(plan.order[0]).toBe(SOURCE_ID);
		expect(plan.order[plan.order.length - 1]).toBe(SINK_ID);
		expect(plan.order).toHaveLength(4);
	});

	it("resolves all nodes during compilation", async () => {
		const plan = await runWithRegistry(compile(linearGraph()));

		for (const id of plan.order) {
			const attrs = plan.graph.getNodeAttributes(id);
			expect(attrs.resolved).toBeDefined();
		}
	});

	it("rejects invalid input", async () => {
		await expect(
			runWithRegistry(compile("not a graph")),
		).rejects.toThrow("Graph parse error");
	});

	it("rejects graphs with cycles through full pipeline", async () => {
		const cyclic = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "action", action: "test/noop", config: {} },
				{ id: ACTION_ID, type: "action", action: "test/noop", config: {} },
			],
			edges: [
				{ from: SOURCE_ID, to: ACTION_ID },
				{ from: ACTION_ID, to: SOURCE_ID },
			],
		};

		await expect(
			runWithRegistry(compile(cyclic)),
		).rejects.toThrow("Graph contains a cycle");
	});

	it("rejects unresolved names through full pipeline", async () => {
		const unresolved = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "action", action: "missing/action", config: {} },
			],
		};

		await expect(
			runWithRegistry(compile(unresolved)),
		).rejects.toThrow("Unresolved names");
	});

	it("preserves concurrency policy in definition", async () => {
		const input = {
			...linearGraph(),
			concurrency: { maxGlobal: 5 },
		};

		const plan = await runWithRegistry(compile(input));

		expect(plan.definition.concurrency?.maxGlobal).toBe(5);
	});
});
