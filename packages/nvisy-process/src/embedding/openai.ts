import type { EmbeddingData } from "@nvisy/core";
import { EmbeddingProvider } from "./base.js";

export type OpenAIEmbeddingModel =
	| "text-embedding-3-small"
	| "text-embedding-3-large"
	| "text-embedding-ada-002";

export class OpenAIEmbedding extends EmbeddingProvider<OpenAIEmbeddingModel> {
	constructor(apiKey: string, model: OpenAIEmbeddingModel) {
		super(apiKey, model);
	}

	async embed(_text: string): Promise<EmbeddingData> {
		throw new Error("Not yet implemented");
	}

	async embedBatch(_texts: string[]): Promise<EmbeddingData[]> {
		throw new Error("Not yet implemented");
	}
}
