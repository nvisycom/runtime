import { describe, expect, it } from "vitest";
import { parseGraph } from "../src/compiler/parse.js";
import { buildPlan } from "../src/compiler/plan.js";
import {
	ACTION_ID,
	CRED_ID,
	diamondGraph,
	EXTRA_ID,
	GRAPH_ID,
	isolatedNodesGraph,
	linearGraph,
	makeTestRegistry,
	SOURCE_ID,
	TARGET_ID,
} from "./fixtures.js";

describe("buildPlan", () => {
	it("produces a topological order for a linear graph", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(linearGraph());
		const plan = buildPlan(parsed, registry);

		expect(plan.order).toEqual([SOURCE_ID, ACTION_ID, TARGET_ID]);
	});

	it("produces a valid topological order for a diamond graph", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(diamondGraph());
		const plan = buildPlan(parsed, registry);

		// Source must come first, sink must come last
		expect(plan.order[0]).toBe(SOURCE_ID);
		expect(plan.order[plan.order.length - 1]).toBe(TARGET_ID);
		// Both middle nodes must appear between source and sink
		expect(plan.order).toContain(ACTION_ID);
		expect(plan.order).toContain(EXTRA_ID);
		expect(plan.order.indexOf(ACTION_ID)).toBeGreaterThan(0);
		expect(plan.order.indexOf(EXTRA_ID)).toBeGreaterThan(0);
		expect(plan.order.indexOf(ACTION_ID)).toBeLessThan(plan.order.length - 1);
		expect(plan.order.indexOf(EXTRA_ID)).toBeLessThan(plan.order.length - 1);
	});

	it("handles isolated nodes (no edges)", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(isolatedNodesGraph());
		const plan = buildPlan(parsed, registry);

		expect(plan.order).toHaveLength(2);
		expect(plan.order).toContain(SOURCE_ID);
		expect(plan.order).toContain(ACTION_ID);
	});

	it("stores resolved entries in the resolved map", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(linearGraph());
		const plan = buildPlan(parsed, registry);

		const sourceResolved = plan.resolved.get(SOURCE_ID);
		expect(sourceResolved).toBeDefined();
		expect(sourceResolved!.type).toBe("source");

		const actionResolved = plan.resolved.get(ACTION_ID);
		expect(actionResolved).toBeDefined();
		expect(actionResolved!.type).toBe("action");

		const targetResolved = plan.resolved.get(TARGET_ID);
		expect(targetResolved).toBeDefined();
		expect(targetResolved!.type).toBe("target");
	});

	it("exposes the graph definition on the plan", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(linearGraph());
		const plan = buildPlan(parsed, registry);

		expect(plan.definition.id).toBe(GRAPH_ID);
		expect(plan.definition.nodes).toHaveLength(3);
	});

	it("plan.graph is the same RuntimeGraph instance", () => {
		const registry = makeTestRegistry();
		const parsed = parseGraph(linearGraph());
		const plan = buildPlan(parsed, registry);

		// Verify graph structure matches definition
		expect(plan.graph.order).toBe(plan.definition.nodes.length);
		expect(plan.graph.size).toBe(plan.definition.edges.length);
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
		expect(() => buildPlan(parsed, registry)).toThrow("Graph contains a cycle");
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
		expect(() => buildPlan(parsed, registry)).toThrow("Unresolved names");
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
					stream: "test/read",
					connection: CRED_ID,
					params: { key: "val" },
				},
			],
		};

		const parsed = parseGraph(input);
		expect(() => buildPlan(parsed, registry)).toThrow("Unresolved names");
	});

	it("rejects unresolved stream names", () => {
		const registry = makeTestRegistry();
		const input = {
			id: GRAPH_ID,
			nodes: [
				{
					id: SOURCE_ID,
					type: "source",
					provider: "test/testdb",
					stream: "test/nonexistent",
					connection: CRED_ID,
					params: { key: "val" },
				},
			],
		};

		const parsed = parseGraph(input);
		expect(() => buildPlan(parsed, registry)).toThrow("Unresolved names");
	});

	it("passes for an empty graph", () => {
		const registry = makeTestRegistry();
		const input = { id: GRAPH_ID, nodes: [] };

		const parsed = parseGraph(input);
		const plan = buildPlan(parsed, registry);

		expect(plan.definition.nodes).toHaveLength(0);
		expect(plan.graph.order).toBe(0);
		expect(plan.resolved.size).toBe(0);
	});
});
