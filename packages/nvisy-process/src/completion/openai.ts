import { CompletionProvider } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type OpenAICompletionModel =
	| "gpt-4o"
	| "gpt-4o-mini"
	| "gpt-4-turbo"
	| "gpt-3.5-turbo";

export class OpenAICompletion extends CompletionProvider<OpenAICompletionModel> {
	constructor(apiKey: string, model: OpenAICompletionModel) {
		super(apiKey, model);
	}

	async complete(
		_messages: Message[],
		_options?: CompletionOptions,
	): Promise<CompletionResult> {
		throw new Error("Not yet implemented");
	}

	async completeStructured<T>(
		_messages: Message[],
		_schema: Record<string, unknown>,
	): Promise<T> {
		throw new Error("Not yet implemented");
	}
}
