import type {
	EmbeddingBatchResult,
	EmbeddingProvider,
	EmbeddingVector,
} from "../base/embedding-provider.js";
import type { EmbeddingModel } from "./models.js";

export class GoogleEmbedding implements EmbeddingProvider {
	readonly model: EmbeddingModel;

	constructor(_apiKey: string, model: EmbeddingModel) {
		this.model = model;
	}

	async embed(_text: string): Promise<EmbeddingVector> {
		throw new Error("Not yet implemented");
	}

	async embedBatch(_texts: string[]): Promise<EmbeddingBatchResult> {
		throw new Error("Not yet implemented");
	}
}
