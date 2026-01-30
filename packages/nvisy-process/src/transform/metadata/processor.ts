import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { MetadataConfig } from "../config/metadata.js";

/** Extracts metadata from input data. */
export class MetadataProcessor extends Processor {
	constructor(_config: MetadataConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
