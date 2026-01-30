import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { DeriveConfig } from "./config.js";

/** Derives new data from existing elements (summaries, titles, context). */
export class DeriveProcessor extends Processor {
	constructor(_config: DeriveConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
