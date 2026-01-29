import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { DeriveConfig } from "../config/derive.js";

/** Derives new data from existing elements (summaries, titles, context). */
export class DeriveProcessor implements Process {
	private readonly config: DeriveConfig;

	constructor(config: DeriveConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
