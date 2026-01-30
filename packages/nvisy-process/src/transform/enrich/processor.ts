import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { EnrichConfig } from "../config/enrich.js";

/** Enriches data elements with AI-generated metadata. */
export class EnrichProcessor extends Processor {
	constructor(_config: EnrichConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
