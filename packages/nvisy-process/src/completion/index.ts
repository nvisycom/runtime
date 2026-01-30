export { CompletionProvider } from "./base.js";
export type {
	CompletionOptions,
	CompletionResult,
	Message,
	MessageRole,
} from "./base.js";
export { AnthropicCompletion } from "./anthropic.js";
export type { AnthropicCompletionModel } from "./anthropic.js";
export { CohereCompletion } from "./cohere.js";
export type { CohereCompletionModel } from "./cohere.js";
export { GoogleCompletion } from "./google.js";
export type { GoogleCompletionModel } from "./google.js";
export { OpenAICompletion } from "./openai.js";
export type { OpenAICompletionModel } from "./openai.js";

import type { CompletionProvider } from "./base.js";
import { AnthropicCompletion } from "./anthropic.js";
import type { AnthropicCompletionModel } from "./anthropic.js";
import { CohereCompletion } from "./cohere.js";
import type { CohereCompletionModel } from "./cohere.js";
import { GoogleCompletion } from "./google.js";
import type { GoogleCompletionModel } from "./google.js";
import { OpenAICompletion } from "./openai.js";
import type { OpenAICompletionModel } from "./openai.js";

export type CompletionProviderName =
	| "openai"
	| "anthropic"
	| "google"
	| "cohere";

export function createCompletionProvider(
	provider: CompletionProviderName,
	model: string,
	apiKey: string,
): CompletionProvider {
	switch (provider) {
		case "openai":
			return new OpenAICompletion(apiKey, model as OpenAICompletionModel);
		case "anthropic":
			return new AnthropicCompletion(
				apiKey,
				model as AnthropicCompletionModel,
			);
		case "google":
			return new GoogleCompletion(apiKey, model as GoogleCompletionModel);
		case "cohere":
			return new CohereCompletion(apiKey, model as CohereCompletionModel);
	}
}
