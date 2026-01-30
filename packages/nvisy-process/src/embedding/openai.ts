import { EmbeddingData } from "@nvisy/core";
import { OpenAIEmbeddings } from "@langchain/openai";
import { EmbeddingProvider } from "./base.js";

export type OpenAIEmbeddingModel =
	| "text-embedding-3-small"
	| "text-embedding-3-large"
	| "text-embedding-ada-002";

export class OpenAIEmbedding extends EmbeddingProvider<OpenAIEmbeddingModel> {
	readonly #client: OpenAIEmbeddings;

	constructor(apiKey: string, model: OpenAIEmbeddingModel) {
		super(apiKey, model);
		this.#client = new OpenAIEmbeddings({ model, apiKey });
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
