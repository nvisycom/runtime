import type { AnyData } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { ExtractConfig } from "./config.js";

/** Extracts structured information from data elements. */
export class ExtractProcessor extends Processor {
	constructor(_config: ExtractConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
