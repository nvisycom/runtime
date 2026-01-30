import type { EmbeddingData } from "@nvisy/core";
import { EmbeddingProvider } from "./base.js";

export type GoogleEmbeddingModel = "text-embedding-004";

export class GoogleEmbedding extends EmbeddingProvider<GoogleEmbeddingModel> {
	constructor(apiKey: string, model: GoogleEmbeddingModel) {
		super(apiKey, model);
	}

	async embed(_text: string): Promise<EmbeddingData> {
		throw new Error("Not yet implemented");
	}

	async embedBatch(_texts: string[]): Promise<EmbeddingData[]> {
		throw new Error("Not yet implemented");
	}
}
