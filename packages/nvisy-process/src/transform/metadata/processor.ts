import type { AnyData } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { MetadataConfig } from "./config.js";

/** Extracts metadata from input data. */
export class MetadataProcessor extends Processor {
	constructor(_config: MetadataConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
