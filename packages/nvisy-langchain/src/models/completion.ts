export type OpenAICompletionModel =
	| "gpt-4o"
	| "gpt-4o-mini"
	| "gpt-4-turbo"
	| "gpt-3.5-turbo";
export type AnthropicCompletionModel =
	| "claude-sonnet-4-20250514"
	| "claude-3-5-haiku-20241022";
export type GoogleCompletionModel = "gemini-2.0-flash" | "gemini-1.5-pro";
export type CohereCompletionModel = "command-r-plus" | "command-r";
export type CompletionModel =
	| OpenAICompletionModel
	| AnthropicCompletionModel
	| GoogleCompletionModel
	| CohereCompletionModel;
