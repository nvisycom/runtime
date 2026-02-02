import { getLogger } from "@logtape/logtape";
import { parseGraph } from "./parse.js";
import { validateGraph } from "./validate.js";
import { buildPlan } from "./plan.js";
import type { ExecutionPlan } from "./plan.js";
import type { Registry } from "../registry/index.js";

const logger = getLogger(["nvisy", "compiler"]);

export { parseGraph, buildRuntimeGraph } from "./parse.js";
export type { ParsedGraph, RuntimeGraph, RuntimeNodeAttrs, RuntimeEdgeAttrs } from "./parse.js";
export { validateGraph } from "./validate.js";
export { buildPlan } from "./plan.js";
export type { ExecutionPlan, ResolvedNode } from "./plan.js";

export const compile = (
	input: unknown,
	registry: Registry,
): ExecutionPlan => {
	logger.info("Compiling graph");
	const parsed = parseGraph(input);
	const validated = validateGraph(parsed, registry);
	const plan = buildPlan(validated, registry);
	logger.info("Graph {graphId} compiled successfully", { graphId: plan.definition.id });
	return plan;
};
