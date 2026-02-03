import { getLogger } from "@logtape/logtape";
import type { Registry } from "../registry/index.js";
import { parseGraph } from "./parse.js";
import type { ExecutionPlan } from "./plan.js";
import { buildPlan } from "./plan.js";
import { validateGraph } from "./validate.js";

const logger = getLogger(["nvisy", "compiler"]);

export type {
	ParsedGraph,
	RuntimeEdgeAttrs,
	RuntimeGraph,
	RuntimeNodeAttrs,
} from "./parse.js";
export { buildRuntimeGraph, parseGraph } from "./parse.js";
export type { ExecutionPlan, ResolvedNode } from "./plan.js";
export { buildPlan } from "./plan.js";
export { validateGraph } from "./validate.js";

export const compile = (input: unknown, registry: Registry): ExecutionPlan => {
	logger.info("Compiling graph");
	const parsed = parseGraph(input);
	const validated = validateGraph(parsed, registry);
	const plan = buildPlan(validated, registry);
	logger.info("Graph {graphId} compiled successfully", {
		graphId: plan.definition.id,
	});
	return plan;
};
