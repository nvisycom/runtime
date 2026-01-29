import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { EmbeddingConfig } from "../config/embedding.js";

/** Generates embeddings for input data, delegating to EmbeddingProvider. */
export class EmbeddingProcessor implements Process {
	private readonly config: EmbeddingConfig;

	constructor(config: EmbeddingConfig) {
		this.config = config;
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
