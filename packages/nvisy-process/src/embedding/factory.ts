import { EmbeddingProvider } from "./base.js";
import type { CohereEmbeddingModel } from "./cohere.js";
import type { GoogleEmbeddingModel } from "./google.js";
import type { OpenAIEmbeddingModel } from "./openai.js";

export function createEmbeddingProvider(
	_model: OpenAIEmbeddingModel | CohereEmbeddingModel | GoogleEmbeddingModel,
	_apiKey: string,
): EmbeddingProvider {
	throw new Error("Not yet implemented");
}
