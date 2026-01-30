import { CompletionProvider } from "./base.js";
import type { AnthropicCompletionModel } from "./anthropic.js";
import type { CohereCompletionModel } from "./cohere.js";
import type { GoogleCompletionModel } from "./google.js";
import type { OpenAICompletionModel } from "./openai.js";

export function createCompletionProvider(
	_model:
		| OpenAICompletionModel
		| AnthropicCompletionModel
		| GoogleCompletionModel
		| CohereCompletionModel,
	_apiKey: string,
): CompletionProvider {
	throw new Error("Not yet implemented");
}
