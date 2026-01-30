import type { AnyData } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { PartitionConfig } from "./config.js";

/** Partitions raw documents into structured elements. */
export class PartitionProcessor extends Processor {
	constructor(_config: PartitionConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
