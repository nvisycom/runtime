import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { MetadataConfig } from "../config/metadata.js";

/** Extracts metadata from input data. */
export class MetadataProcessor implements Process {
	private readonly config: MetadataConfig;

	constructor(config: MetadataConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
