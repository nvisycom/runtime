import type { CompletionProvider } from "../base/completion-provider.js";
import type {
	CompletionOptions,
	CompletionResult,
	Message,
} from "../base/message.js";
import type { CompletionModel } from "./models.js";

export class AnthropicCompletion implements CompletionProvider {
	readonly model: CompletionModel;

	constructor(_apiKey: string, model: CompletionModel) {
		this.model = model;
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
