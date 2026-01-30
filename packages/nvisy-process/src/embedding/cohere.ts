import type { EmbeddingData } from "@nvisy/core";
import { EmbeddingProvider } from "./base.js";

export type CohereEmbeddingModel =
	| "embed-english-v3.0"
	| "embed-multilingual-v3.0";

export class CohereEmbedding extends EmbeddingProvider<CohereEmbeddingModel> {
	constructor(apiKey: string, model: CohereEmbeddingModel) {
		super(apiKey, model);
	}

	async embed(_text: string): Promise<EmbeddingData> {
		throw new Error("Not yet implemented");
	}

	async embedBatch(_texts: string[]): Promise<EmbeddingData[]> {
		throw new Error("Not yet implemented");
	}
}
