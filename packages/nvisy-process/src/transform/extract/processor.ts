import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { ExtractConfig } from "../config/extract.js";

/** Extracts structured information from data elements. */
export class ExtractProcessor extends Processor {
	constructor(_config: ExtractConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
