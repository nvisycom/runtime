import type { EmbeddingModel } from "../models/embedding.js";

export interface EmbeddingVector {
	vector: number[];
	dimensions: number;
}

export interface EmbeddingBatchResult {
	vectors: EmbeddingVector[];
}

export interface EmbeddingProvider {
	readonly model: EmbeddingModel;
	embed(text: string): Promise<EmbeddingVector>;
	embedBatch(texts: string[]): Promise<EmbeddingBatchResult>;
}
