import type { ApiCredentials } from "../base/credentials.js";
import type { EmbeddingProvider } from "../base/embedding-provider.js";
import type { EmbeddingModel } from "./models.js";

export function createEmbeddingProvider(
	_model: EmbeddingModel,
	_credentials: ApiCredentials,
): EmbeddingProvider {
	throw new Error("Not yet implemented");
}
