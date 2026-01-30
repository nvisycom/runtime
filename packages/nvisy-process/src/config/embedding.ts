import type { EmbeddingModel } from "../embedding/models.js";

export interface EmbeddingConfig {
	model: EmbeddingModel;
	normalize?: boolean;
	batchSize?: number;
}
