import type {
	EmbeddingBatchResult,
	EmbeddingProvider,
	EmbeddingVector,
} from "../interfaces/embedding.js";
import type { EmbeddingModel } from "../models/embedding.js";

export class CohereEmbedding implements EmbeddingProvider {
	readonly model: EmbeddingModel;
	private readonly apiKey: string;

	constructor(apiKey: string, model: EmbeddingModel) {
		this.apiKey = apiKey;
		this.model = model;
	}

	async embed(_text: string): Promise<EmbeddingVector> {
		throw new Error("Not yet implemented");
	}

	async embedBatch(_texts: string[]): Promise<EmbeddingBatchResult> {
		throw new Error("Not yet implemented");
	}
}
