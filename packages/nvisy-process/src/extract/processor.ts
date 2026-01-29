import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { ExtractConfig } from "../config/extract.js";

/** Extracts structured information from data elements. */
export class ExtractProcessor implements Process {
	private readonly config: ExtractConfig;

	constructor(config: ExtractConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
