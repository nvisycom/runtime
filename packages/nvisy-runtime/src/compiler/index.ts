import { Effect } from "effect";
import { parseGraph } from "./parse.js";
import { validateGraph } from "./validate.js";
import { buildPlan } from "./plan.js";
import type { ExecutionPlan } from "./plan.js";
import type { Registry } from "../registry/index.js";

export { parseGraph, buildRuntimeGraph } from "./parse.js";
export type { ParsedGraph, RuntimeGraph, RuntimeNodeAttrs, RuntimeEdgeAttrs } from "./parse.js";
export { validateGraph } from "./validate.js";
export { buildPlan } from "./plan.js";
export type { ExecutionPlan, ResolvedNode } from "./plan.js";

export const compile = (
	input: unknown,
): Effect.Effect<ExecutionPlan, Error, Registry> =>
	parseGraph(input).pipe(
		Effect.flatMap(validateGraph),
		Effect.flatMap(buildPlan),
	);
