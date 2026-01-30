import type { AnyDataValue } from "@nvisy/core";
import { Processor } from "../base/processor.js";
import type { EmbeddingConfig } from "../transform/config/embedding.js";

/** Generates embeddings for input data, delegating to EmbeddingProvider. */
export class EmbeddingProcessor extends Processor {
	constructor(_config: EmbeddingConfig) {
		super();
	}

	async process(_input: AnyDataValue[]): Promise<AnyDataValue[]> {
		throw new Error("Not yet implemented");
	}
}
