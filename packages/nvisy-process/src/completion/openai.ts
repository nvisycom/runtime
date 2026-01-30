import { ChatOpenAI } from "@langchain/openai";
import type { UsageMetadata } from "@langchain/core/messages";
import { CompletionProvider, toLangchainMessages } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type OpenAICompletionModel =
	| "gpt-4o"
	| "gpt-4o-mini"
	| "gpt-4-turbo"
	| "gpt-3.5-turbo";

export class OpenAICompletion extends CompletionProvider<OpenAICompletionModel> {
	readonly #apiKey: string;

	constructor(apiKey: string, model: OpenAICompletionModel) {
		super(apiKey, model);
		this.#apiKey = apiKey;
	}

	async complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult> {
		const client = new ChatOpenAI({
			model: this.model,
			apiKey: this.#apiKey,
			...(options?.temperature !== undefined && {
				temperature: options.temperature,
			}),
			...(options?.maxTokens !== undefined && {
				maxTokens: options.maxTokens,
			}),
			...(options?.topP !== undefined && { topP: options.topP }),
			...(options?.stopSequences !== undefined && {
				stop: options.stopSequences,
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
				(response.response_metadata?.["finish_reason"] as string) ??
				"unknown",
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
		const client = new ChatOpenAI({
			model: this.model,
			apiKey: this.#apiKey,
		});
		const structured = client.withStructuredOutput(schema);
		return (await structured.invoke(toLangchainMessages(messages))) as T;
	}
}
