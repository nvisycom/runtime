import { CompletionProvider } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type AnthropicCompletionModel =
	| "claude-sonnet-4-20250514"
	| "claude-3-5-haiku-20241022";

export class AnthropicCompletion extends CompletionProvider<AnthropicCompletionModel> {
	constructor(apiKey: string, model: AnthropicCompletionModel) {
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
