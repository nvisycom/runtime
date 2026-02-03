import { describe, expect, it } from "vitest";
import { compile } from "../src/compiler/index.js";
import {
	ACTION_ID,
	diamondGraph,
	GRAPH_ID,
	linearGraph,
	makeTestRegistry,
	SOURCE_ID,
	TARGET_ID,
} from "./fixtures.js";

describe("compile", () => {
	it("compiles a valid linear graph end-to-end", () => {
		const registry = makeTestRegistry();
		const plan = compile(linearGraph(), registry);

		expect(plan.definition.id).toBe(GRAPH_ID);
		expect(plan.order).toEqual([SOURCE_ID, ACTION_ID, TARGET_ID]);
		expect(plan.graph.order).toBe(3);
		expect(plan.graph.size).toBe(2);
	});

	it("compiles a diamond graph end-to-end", () => {
		const registry = makeTestRegistry();
		const plan = compile(diamondGraph(), registry);

		expect(plan.order[0]).toBe(SOURCE_ID);
		expect(plan.order[plan.order.length - 1]).toBe(TARGET_ID);
		expect(plan.order).toHaveLength(4);
	});

	it("resolves all nodes during compilation", () => {
		const registry = makeTestRegistry();
		const plan = compile(linearGraph(), registry);

		for (const id of plan.order) {
			const attrs = plan.graph.getNodeAttributes(id);
			expect(attrs.resolved).toBeDefined();
		}
	});

	it("rejects invalid input", () => {
		const registry = makeTestRegistry();

		expect(() => compile("not a graph", registry)).toThrow("Graph parse error");
	});

	it("rejects graphs with cycles through full pipeline", () => {
		const registry = makeTestRegistry();
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

		expect(() => compile(cyclic, registry)).toThrow("Graph contains a cycle");
	});

	it("rejects unresolved names through full pipeline", () => {
		const registry = makeTestRegistry();
		const unresolved = {
			id: GRAPH_ID,
			nodes: [
				{ id: SOURCE_ID, type: "action", action: "missing/action", config: {} },
			],
		};

		expect(() => compile(unresolved, registry)).toThrow("Unresolved names");
	});

	it("preserves concurrency policy in definition", () => {
		const registry = makeTestRegistry();
		const input = {
			...linearGraph(),
			concurrency: { maxGlobal: 5 },
		};

		const plan = compile(input, registry);

		expect(plan.definition.concurrency?.maxGlobal).toBe(5);
	});
});
