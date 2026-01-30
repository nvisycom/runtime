import type { AnyDataValue } from "@nvisy/core";
import type { Process } from "../base/process.js";
import type { EmbeddingConfig } from "../config/embedding.js";

/** Generates embeddings for input data, delegating to EmbeddingProvider. */
export class EmbeddingProcessor implements Process {
	constructor(_config: EmbeddingConfig) {}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
