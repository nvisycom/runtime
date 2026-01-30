import { CompletionProvider } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type GoogleCompletionModel = "gemini-2.0-flash" | "gemini-1.5-pro";

export class GoogleCompletion extends CompletionProvider<GoogleCompletionModel> {
	constructor(apiKey: string, model: GoogleCompletionModel) {
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
