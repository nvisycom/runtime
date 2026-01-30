import { ChatCohere } from "@langchain/cohere";
import type { UsageMetadata } from "@langchain/core/messages";
import { CompletionProvider, toLangchainMessages } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type CohereCompletionModel = "command-r-plus" | "command-r";

export class CohereCompletion extends CompletionProvider<CohereCompletionModel> {
	readonly #apiKey: string;

	constructor(apiKey: string, model: CohereCompletionModel) {
		super(apiKey, model);
		this.#apiKey = apiKey;
	}

	async complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult> {
		const client = new ChatCohere({
			model: this.model,
			apiKey: this.#apiKey,
			...(options?.temperature !== undefined && {
				temperature: options.temperature,
			}),
		});

		const response = await client.invoke(toLangchainMessages(messages));

		const content =
			typeof response.content === "string"
				? response.content
				: JSON.stringify(response.content);

		const usage = response.usage_metadata as UsageMetadata | undefined;

		return {
			content,
			finishReason:
				(response.response_metadata?.["finishReason"] as string) ?? "unknown",
			usage: {
				promptTokens: usage?.input_tokens ?? 0,
				completionTokens: usage?.output_tokens ?? 0,
				totalTokens: usage?.total_tokens ?? 0,
			},
		};
	}

	async completeStructured<T>(
		messages: Message[],
		schema: Record<string, unknown>,
	): Promise<T> {
		const client = new ChatCohere({
			model: this.model,
			apiKey: this.#apiKey,
		});
		const structured = client.withStructuredOutput(schema);
		return (await structured.invoke(toLangchainMessages(messages))) as T;
	}
}
