import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { ExtractConfig } from "../config/extract.js";

/** Extracts structured information from data elements. */
export class ExtractProcessor implements Process {
	constructor(_config: ExtractConfig) {}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
