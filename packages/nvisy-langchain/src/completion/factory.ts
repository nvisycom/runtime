import type { CompletionProvider } from "../interfaces/completion.js";
import type { ApiCredentials } from "../interfaces/credentials.js";
import type { CompletionModel } from "../models/completion.js";

export function createCompletionProvider(
	_model: CompletionModel,
	_credentials: ApiCredentials,
): CompletionProvider {
	throw new Error("Not yet implemented");
}
