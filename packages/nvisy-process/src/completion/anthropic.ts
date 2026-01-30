import { ChatAnthropic } from "@langchain/anthropic";
import type { UsageMetadata } from "@langchain/core/messages";
import { CompletionProvider, toLangchainMessages } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type AnthropicCompletionModel =
	| "claude-sonnet-4-20250514"
	| "claude-3-5-haiku-20241022";

export class AnthropicCompletion extends CompletionProvider<AnthropicCompletionModel> {
	readonly #apiKey: string;

	constructor(apiKey: string, model: AnthropicCompletionModel) {
		super(apiKey, model);
		this.#apiKey = apiKey;
	}

	async complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult> {
		const client = new ChatAnthropic({
			model: this.model,
			apiKey: this.#apiKey,
			maxTokens: options?.maxTokens ?? 4096,
			...(options?.temperature !== undefined && {
				temperature: options.temperature,
			}),
			...(options?.topP !== undefined && { topP: options.topP }),
			...(options?.stopSequences !== undefined && {
				stopSequences: options.stopSequences,
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
				(response.response_metadata?.["stop_reason"] as string) ?? "unknown",
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
		const client = new ChatAnthropic({
			model: this.model,
			apiKey: this.#apiKey,
			maxTokens: 4096,
		});
		const structured = client.withStructuredOutput(schema);
		return (await structured.invoke(toLangchainMessages(messages))) as T;
	}
}
