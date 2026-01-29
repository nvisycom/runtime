export type OpenAIEmbeddingModel =
	| "text-embedding-3-small"
	| "text-embedding-3-large"
	| "text-embedding-ada-002";
export type CohereEmbeddingModel =
	| "embed-english-v3.0"
	| "embed-multilingual-v3.0";
export type GoogleEmbeddingModel = "text-embedding-004";
export type EmbeddingModel =
	| OpenAIEmbeddingModel
	| CohereEmbeddingModel
	| GoogleEmbeddingModel;
