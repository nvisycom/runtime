import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { ChunkConfig } from "../config/chunk.js";

/** Chunks data into smaller segments using the configured strategy. */
export class ChunkProcessor implements Process {
	private readonly config: ChunkConfig;

	constructor(config: ChunkConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
