import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { ConvertConfig } from "./config.js";

/** Converts data between formats. */
export class ConvertProcessor extends Processor {
	constructor(_config: ConvertConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
