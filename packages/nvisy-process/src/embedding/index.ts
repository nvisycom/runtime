export { EmbeddingProvider } from "./base.js";
export type { CohereEmbeddingModel } from "./cohere.js";
export type { GoogleEmbeddingModel } from "./google.js";
export type { OpenAIEmbeddingModel } from "./openai.js";

import type { AnyData } from "@nvisy/core";
import { Processor } from "../base/processor.js";
import type { EmbeddingProvider } from "./base.js";
import { CohereEmbedding } from "./cohere.js";
import type { CohereEmbeddingModel } from "./cohere.js";
import { GoogleEmbedding } from "./google.js";
import type { GoogleEmbeddingModel } from "./google.js";
import { OpenAIEmbedding } from "./openai.js";
import type { OpenAIEmbeddingModel } from "./openai.js";

// ── Config ──────────────────────────────────────────────────────────

export interface EmbeddingConfig {
	model: OpenAIEmbeddingModel | CohereEmbeddingModel | GoogleEmbeddingModel;
	normalize?: boolean;
	batchSize?: number;
}

// ── Factory ─────────────────────────────────────────────────────────

export type EmbeddingProviderName = "openai" | "google" | "cohere";

export function createEmbeddingProvider(
	provider: EmbeddingProviderName,
	model: string,
	apiKey: string,
): EmbeddingProvider {
	switch (provider) {
		case "openai":
			return new OpenAIEmbedding(apiKey, model as OpenAIEmbeddingModel);
		case "google":
			return new GoogleEmbedding(apiKey, model as GoogleEmbeddingModel);
		case "cohere":
			return new CohereEmbedding(apiKey, model as CohereEmbeddingModel);
	}
}

// ── Processor ───────────────────────────────────────────────────────

/** Generates embeddings for input data, delegating to EmbeddingProvider. */
export class EmbeddingProcessor extends Processor {
	constructor(_config: EmbeddingConfig) {
		super();
	}

	async process(_input: AnyData[]): Promise<AnyData[]> {
		throw new Error("Not yet implemented");
	}
}
