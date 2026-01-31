import { Effect } from "effect";
import { parseGraph } from "./parse.js";
import { validateGraph } from "./validate.js";
import { buildPlan } from "./plan.js";
import type { ExecutionPlan } from "./plan.js";

export { parseGraph } from "./parse.js";
export { validateGraph } from "./validate.js";
export { buildPlan } from "./plan.js";
export type { ExecutionPlan } from "./plan.js";

export const compile = (
	input: unknown,
): Effect.Effect<ExecutionPlan, Error> =>
	parseGraph(input).pipe(
		Effect.flatMap(validateGraph),
		Effect.flatMap(buildPlan),
	);
