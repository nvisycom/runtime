import { EmbeddingData } from "@nvisy/core";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { EmbeddingProvider } from "./base.js";

export type GoogleEmbeddingModel = "text-embedding-004";

export class GoogleEmbedding extends EmbeddingProvider<GoogleEmbeddingModel> {
	readonly #client: GoogleGenerativeAIEmbeddings;

	constructor(apiKey: string, model: GoogleEmbeddingModel) {
		super(apiKey, model);
		this.#client = new GoogleGenerativeAIEmbeddings({ model, apiKey });
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
