import type { CompletionProvider } from "../interfaces/completion.js";
import type {
	CompletionOptions,
	CompletionResult,
	Message,
} from "../interfaces/message.js";
import type { CompletionModel } from "../models/completion.js";

export class GoogleCompletion implements CompletionProvider {
	readonly model: CompletionModel;
	private readonly apiKey: string;

	constructor(apiKey: string, model: CompletionModel) {
		this.apiKey = apiKey;
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
