import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { ConvertConfig } from "../config/convert.js";

/** Converts data between formats. */
export class ConvertProcessor implements Process {
	private readonly config: ConvertConfig;

	constructor(config: ConvertConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
