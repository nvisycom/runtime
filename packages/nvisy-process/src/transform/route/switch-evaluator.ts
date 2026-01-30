import type { AnyData } from "@nvisy/core";
import type { SwitchCondition } from "./config.js";

/** Evaluates switch conditions against input data for routing. */
export class SwitchEvaluator {
	evaluate(_condition: SwitchCondition, _input: AnyData): boolean {
		throw new Error("Not yet implemented");
	}
}
