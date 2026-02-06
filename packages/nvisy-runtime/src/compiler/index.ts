import { getLogger } from "@logtape/logtape";
import type { Registry } from "../registry.js";
import { parseGraph } from "./parse.js";
import type { ExecutionPlan } from "./plan.js";
import { buildPlan } from "./plan.js";

const logger = getLogger(["nvisy", "compiler"]);

export type {
	ExecutionPlan,
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "./plan.js";

/** Compile a graph definition into an execution plan. */
export function compile(input: unknown, registry: Registry): ExecutionPlan {
	logger.info("Compiling graph");
	const parsed = parseGraph(input);
	const plan = buildPlan(parsed, registry);
	logger.info("Graph {graphId} compiled successfully", {
		graphId: plan.definition.id,
	});
	return plan;
}
