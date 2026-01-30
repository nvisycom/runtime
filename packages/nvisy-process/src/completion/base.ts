// ── Message types ───────────────────────────────────────────────────

export type MessageRole = "system" | "user" | "assistant";

export interface Message {
	role: MessageRole;
	content: string;
}

export interface CompletionOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	stopSequences?: string[];
	responseFormat?: Record<string, unknown>;
}

export interface CompletionResult {
	content: string;
	finishReason: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

// ── Abstract provider ───────────────────────────────────────────────

/**
 * Abstract base class for completion (LLM) providers.
 *
 * Stores the API key and model as immutable private fields, exposing
 * them through read-only getters. Subclasses implement
 * {@link complete} and {@link completeStructured} for their backend.
 *
 * @example
 * ```ts
 * class MyLLM extends CompletionProvider<OpenAICompletionModel> {
 *   async complete(messages, options?) { ... }
 *   async completeStructured<T>(messages, schema) { ... }
 * }
 * const llm = new MyLLM("sk-...", "gpt-4o");
 * llm.model; // "gpt-4o"
 * ```
 */
export abstract class CompletionProvider<TModel extends string = string> {
	readonly #apiKey: string;
	readonly #model: TModel;

	constructor(apiKey: string, model: TModel) {
		this.#apiKey = apiKey;
		this.#model = model;
	}

	/** API key used to authenticate with the provider. */
	get apiKey(): string {
		return this.#apiKey;
	}

	/** Model identifier. */
	get model(): TModel {
		return this.#model;
	}

	/** Generate a completion from a list of messages. */
	abstract complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult>;

	/** Generate a structured (JSON) completion from a list of messages. */
	abstract completeStructured<T>(
		messages: Message[],
		schema: Record<string, unknown>,
	): Promise<T>;
}
