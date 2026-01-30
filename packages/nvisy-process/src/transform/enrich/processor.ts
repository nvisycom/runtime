import type { AnyData } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { EnrichConfig } from "./config.js";

/** Enriches data elements with AI-generated metadata. */
export class EnrichProcessor extends Processor {
	constructor(_config: EnrichConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
