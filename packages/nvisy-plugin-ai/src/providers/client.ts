import { getLogger } from "@logtape/logtape";
import { ConnectionError, Provider, type ProviderFactory } from "@nvisy/core";
import type { EmbeddingModel, LanguageModel } from "ai";
import { embedMany, generateText } from "ai";
import type { ProviderConnection } from "./schemas.js";
import { ProviderConnection as ApiKeyCredentialsSchema } from "./schemas.js";

export type { ProviderConnection } from "./schemas.js";

const logger = getLogger(["nvisy", "ai"]);

/** A single message in a chat conversation. */
export interface ChatMessage {
	readonly role: "system" | "user" | "assistant";
	readonly content: string;
}

/** Options for a completion request. */
export interface CompletionOptions {
	/** Messages comprising the conversation. */
	readonly messages: ReadonlyArray<ChatMessage>;
	/** Sampling temperature (0-2). */
	readonly temperature?: number;
	/** Maximum tokens to generate. */
	readonly maxTokens?: number;
}

/** Result of a completion request. */
export interface CompletionResult {
	/** Generated text content. */
	readonly content: string;
	/** Token usage statistics. */
	readonly usage?: {
		readonly promptTokens: number;
		readonly completionTokens: number;
	};
}

/** Options for an embedding request. */
export interface EmbedOptions {
	/** Desired embedding dimensions (if supported by the model). */
	readonly dimensions?: number;
}

/**
 * Abstract AI client with completion capability.
 */
export abstract class AICompletionClient {
	abstract complete(options: CompletionOptions): Promise<CompletionResult>;
}

/**
 * Abstract AI client with embedding capability.
 */
export abstract class EmbeddingClient {
	abstract embed(
		input: string[],
		options: EmbedOptions,
	): Promise<Float32Array[]>;
}

/** Build the generateText call options from our CompletionOptions. */
function buildGenerateTextArgs(
	model: LanguageModel,
	options: CompletionOptions,
) {
	const systemParts = options.messages
		.filter((m) => m.role === "system")
		.map((m) => m.content);

	const systemText =
		systemParts.length > 0 ? systemParts.join("\n\n") : undefined;

	return {
		model,
		...(systemText != null ? { system: systemText } : {}),
		messages: options.messages
			.filter((m) => m.role !== "system")
			.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			})),
		...(options.temperature != null
			? { temperature: options.temperature }
			: {}),
		...(options.maxTokens != null
			? { maxOutputTokens: options.maxTokens }
			: {}),
	};
}

/** Map AI SDK usage to our CompletionResult format. */
function mapUsage(
	usage:
		| { inputTokens: number | undefined; outputTokens: number | undefined }
		| undefined,
): CompletionResult["usage"] {
	if (!usage || usage.inputTokens == null || usage.outputTokens == null) {
		return undefined;
	}
	return {
		promptTokens: usage.inputTokens,
		completionTokens: usage.outputTokens,
	};
}

/**
 * Embedding-only AI client backed by the Vercel AI SDK.
 *
 * Uses {@link embedMany} from the `ai` package,
 * delegating model creation to provider-specific factories.
 */
export class VercelEmbeddingClient extends EmbeddingClient {
	readonly #model: EmbeddingModel;

	constructor(config: { embeddingModel: EmbeddingModel }) {
		super();
		this.#model = config.embeddingModel;
	}

	async embed(
		input: string[],
		_options: EmbedOptions,
	): Promise<Float32Array[]> {
		const result = await embedMany({
			model: this.#model,
			values: input,
		});

		return result.embeddings.map((e) => new Float32Array(e));
	}
}

/**
 * Completion-only AI client backed by the Vercel AI SDK.
 */
export class VercelCompletionClient extends AICompletionClient {
	readonly #model: LanguageModel;

	constructor(config: { languageModel: LanguageModel }) {
		super();
		this.#model = config.languageModel;
	}

	async complete(options: CompletionOptions): Promise<CompletionResult> {
		const result = await generateText(
			buildGenerateTextArgs(this.#model, options),
		);
		const usage = mapUsage(result.usage);
		return {
			content: result.text,
			...(usage != null ? { usage } : {}),
		};
	}
}

/** Normalise an unknown throw into a {@link ConnectionError}. */
function toConnectionError(error: unknown, source: string): ConnectionError {
	if (error instanceof ConnectionError) return error;
	logger.error("Connection to {provider} failed: {error}", {
		provider: source,
		error: error instanceof Error ? error.message : String(error),
	});
	return ConnectionError.wrap(error, { source });
}

/** Configuration for {@link makeProvider}. */
export interface ProviderConfig<TClient> {
	/** Unique provider identifier, e.g. `"openai"`, `"anthropic"`, `"gemini"`. */
	readonly id: string;
	/** Factory that creates an AI client from validated credentials. */
	readonly createClient: (credentials: ProviderConnection) => TClient;
	/** Verify the connection is live (called once during connect). */
	readonly verify: (credentials: ProviderConnection) => Promise<void>;
}

/**
 * Create an AI {@link ProviderFactory} parameterised by a client constructor.
 *
 * The returned factory validates {@link ProviderConnection} at parse time, then
 * creates the client on connect after verifying connectivity.
 */
export const makeProvider = <TClient>(
	config: ProviderConfig<TClient>,
): ProviderFactory<ProviderConnection, TClient> =>
	Provider.withAuthentication(config.id, {
		credentials: ApiKeyCredentialsSchema,
		verify: config.verify,
		connect: async (credentials) => {
			try {
				const client = config.createClient(credentials);
				logger.info("Connected to {provider}", { provider: config.id });
				return {
					client,
					disconnect: async () => {
						logger.debug("Disconnected from {provider}", {
							provider: config.id,
						});
					},
				};
			} catch (error) {
				throw toConnectionError(error, config.id);
			}
		},
	});
