import { CompletionProvider } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type CohereCompletionModel = "command-r-plus" | "command-r";

export class CohereCompletion extends CompletionProvider<CohereCompletionModel> {
	constructor(apiKey: string, model: CohereCompletionModel) {
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
