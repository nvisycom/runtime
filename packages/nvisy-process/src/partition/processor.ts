import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { PartitionConfig } from "../config/partition.js";

/** Partitions raw documents into structured elements. */
export class PartitionProcessor implements Process {
	constructor(_config: PartitionConfig) {}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
