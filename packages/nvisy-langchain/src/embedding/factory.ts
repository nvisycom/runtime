import type { ApiCredentials } from "../interfaces/credentials.js";
import type { EmbeddingProvider } from "../interfaces/embedding.js";
import type { EmbeddingModel } from "../models/embedding.js";

export function createEmbeddingProvider(
	_model: EmbeddingModel,
	_credentials: ApiCredentials,
): EmbeddingProvider {
	throw new Error("Not yet implemented");
}
