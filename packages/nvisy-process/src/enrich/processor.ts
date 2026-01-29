import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { EnrichConfig } from "../config/enrich.js";

/** Enriches data elements with AI-generated metadata. */
export class EnrichProcessor implements Process {
	private readonly config: EnrichConfig;

	constructor(config: EnrichConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
