import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { UsageMetadata } from "@langchain/core/messages";
import { CompletionProvider, toLangchainMessages } from "./base.js";
import type { CompletionOptions, CompletionResult, Message } from "./base.js";

export type GoogleCompletionModel = "gemini-2.0-flash" | "gemini-1.5-pro";

export class GoogleCompletion extends CompletionProvider<GoogleCompletionModel> {
	readonly #apiKey: string;

	constructor(apiKey: string, model: GoogleCompletionModel) {
		super(apiKey, model);
		this.#apiKey = apiKey;
	}

	async complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult> {
		const client = new ChatGoogleGenerativeAI({
			model: this.model,
			apiKey: this.#apiKey,
			...(options?.temperature !== undefined && {
				temperature: options.temperature,
			}),
			...(options?.maxTokens !== undefined && {
				maxOutputTokens: options.maxTokens,
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
		const client = new ChatGoogleGenerativeAI({
			model: this.model,
			apiKey: this.#apiKey,
		});
		const structured = client.withStructuredOutput(schema);
		return (await structured.invoke(toLangchainMessages(messages))) as T;
	}
}
