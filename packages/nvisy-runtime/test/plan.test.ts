import { describe, expect, it } from "vitest";
import { parseGraph } from "../src/compiler/parse.js";
import { buildPlan } from "../src/compiler/plan.js";
import { validateGraph } from "../src/compiler/validate.js";
import {
	ACTION_ID,
	diamondGraph,
	EXTRA_ID,
	GRAPH_ID,
	isolatedNodesGraph,
	linearGraph,
	makeTestRegistry,
	SOURCE_ID,
	TARGET_ID,
} from "./fixtures.js";

const parseThenValidate = (input: unknown) => {
	const registry = makeTestRegistry();
	const parsed = parseGraph(input);
	return { validated: validateGraph(parsed, registry), registry };
};

describe("buildPlan", () => {
	it("produces a topological order for a linear graph", () => {
		const { validated, registry } = parseThenValidate(linearGraph());
		const plan = buildPlan(validated, registry);

		expect(plan.order).toEqual([SOURCE_ID, ACTION_ID, TARGET_ID]);
	});

	it("produces a valid topological order for a diamond graph", () => {
		const { validated, registry } = parseThenValidate(diamondGraph());
		const plan = buildPlan(validated, registry);

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
		const { validated, registry } = parseThenValidate(isolatedNodesGraph());
		const plan = buildPlan(validated, registry);

		expect(plan.order).toHaveLength(2);
		expect(plan.order).toContain(SOURCE_ID);
		expect(plan.order).toContain(ACTION_ID);
	});

	it("stores resolved entries as node attributes", () => {
		const { validated, registry } = parseThenValidate(linearGraph());
		const plan = buildPlan(validated, registry);

		const sourceAttrs = plan.graph.getNodeAttributes(SOURCE_ID);
		expect(sourceAttrs.resolved).toBeDefined();
		expect(sourceAttrs.resolved!.type).toBe("source");

		const actionAttrs = plan.graph.getNodeAttributes(ACTION_ID);
		expect(actionAttrs.resolved).toBeDefined();
		expect(actionAttrs.resolved!.type).toBe("action");

		const sinkAttrs = plan.graph.getNodeAttributes(TARGET_ID);
		expect(sinkAttrs.resolved).toBeDefined();
		expect(sinkAttrs.resolved!.type).toBe("target");
	});

	it("exposes the graph definition on the plan", () => {
		const { validated, registry } = parseThenValidate(linearGraph());
		const plan = buildPlan(validated, registry);

		expect(plan.definition.id).toBe(GRAPH_ID);
		expect(plan.definition.nodes).toHaveLength(3);
	});

	it("plan.graph is the same RuntimeGraph instance", () => {
		const { validated, registry } = parseThenValidate(linearGraph());
		const plan = buildPlan(validated, registry);

		// Verify graph structure matches definition
		expect(plan.graph.order).toBe(plan.definition.nodes.length);
		expect(plan.graph.size).toBe(plan.definition.edges.length);
	});
});
