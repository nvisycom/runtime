import type { AnyData } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { ConvertConfig } from "./config.js";

/** Converts data between formats. */
export class ConvertProcessor extends Processor {
	constructor(_config: ConvertConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
