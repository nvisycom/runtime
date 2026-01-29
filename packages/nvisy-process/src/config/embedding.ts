import type { EmbeddingModel } from "@nvisy/langchain";

export interface EmbeddingConfig {
	model: EmbeddingModel;
	normalize?: boolean;
	batchSize?: number;
}
