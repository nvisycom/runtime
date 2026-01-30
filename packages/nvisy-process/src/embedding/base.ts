import type { EmbeddingData } from "@nvisy/core";

// ── Abstract provider ───────────────────────────────────────────────

/**
 * Abstract base class for embedding providers.
 *
 * Stores the API key and model as immutable private fields, exposing
 * them through read-only getters. Subclasses implement
 * {@link embed} and {@link embedBatch} for their backend.
 *
 * @example
 * ```ts
 * class MyEmbed extends EmbeddingProvider<OpenAIEmbeddingModel> {
 *   async embed(text) { ... }
 *   async embedBatch(texts) { ... }
 * }
 * const emb = new MyEmbed("sk-...", "text-embedding-3-small");
 * emb.model; // "text-embedding-3-small"
 * ```
 */
export abstract class EmbeddingProvider<TModel extends string = string> {
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

	/** Generate an embedding for a single text. */
	abstract embed(text: string): Promise<EmbeddingData>;

	/** Generate embeddings for a batch of texts. */
	abstract embedBatch(texts: string[]): Promise<EmbeddingData[]>;
}
