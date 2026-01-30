import type { CohereEmbeddingModel } from "../../embedding/cohere.js";
import type { GoogleEmbeddingModel } from "../../embedding/google.js";
import type { OpenAIEmbeddingModel } from "../../embedding/openai.js";

export interface EmbeddingConfig {
	model: OpenAIEmbeddingModel | CohereEmbeddingModel | GoogleEmbeddingModel;
	normalize?: boolean;
	batchSize?: number;
}
