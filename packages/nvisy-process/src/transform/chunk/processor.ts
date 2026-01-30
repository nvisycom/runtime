import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../../base/processor.js";
import type { ChunkConfig } from "./config.js";

/** Chunks data into smaller segments using the configured strategy. */
export class ChunkProcessor extends Processor {
	constructor(_config: ChunkConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
