import type { CompletionProvider } from "../base/completion-provider.js";
import type { ApiCredentials } from "../base/credentials.js";
import type { CompletionModel } from "./models.js";

export function createCompletionProvider(
	_model: CompletionModel,
	_credentials: ApiCredentials,
): CompletionProvider {
	throw new Error("Not yet implemented");
}
