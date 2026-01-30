import { EmbeddingData } from "@nvisy/core";
import { CohereEmbeddings } from "@langchain/cohere";
import { EmbeddingProvider } from "./base.js";

export type CohereEmbeddingModel =
	| "embed-english-v3.0"
	| "embed-multilingual-v3.0";

export class CohereEmbedding extends EmbeddingProvider<CohereEmbeddingModel> {
	readonly #client: CohereEmbeddings;

	constructor(apiKey: string, model: CohereEmbeddingModel) {
		super(apiKey, model);
		this.#client = new CohereEmbeddings({ model, apiKey });
	}

	async embed(text: string): Promise<EmbeddingData> {
		const vector = await this.#client.embedQuery(text);
		return new EmbeddingData(vector);
	}

	async embedBatch(texts: string[]): Promise<EmbeddingData[]> {
		const vectors = await this.#client.embedDocuments(texts);
		return vectors.map((vector) => new EmbeddingData(vector));
	}
}
