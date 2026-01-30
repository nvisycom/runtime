import type { AnyDataValue } from "@nvisy/core";
import type { SwitchCondition } from "./config.js";

/** Evaluates switch conditions against input data for routing. */
export class SwitchEvaluator {
	evaluate(_condition: SwitchCondition, _input: AnyDataValue): boolean {
		throw new Error("Not yet implemented");
	}
}
