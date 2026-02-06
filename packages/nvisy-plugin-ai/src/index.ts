/**
 * @module @nvisy/plugin-ai
 *
 * AI provider plugin for the Nvisy runtime.
 *
 * Exposes LLM providers (OpenAI, Anthropic, Gemini), embedding generation,
 * chunking, partitioning, and enrichment actions for AI-powered pipelines.
 *
 * Backed by the Vercel AI SDK for unified provider access.
 *
 * @example
 * ```ts
 * import { aiPlugin } from "@nvisy/plugin-ai";
 *
 * engine.register(aiPlugin);
 * ```
 */

import { Datatypes, Plugin } from "@nvisy/core";
import {
	chunk,
	chunkContextual,
	chunkSimilarity,
	embed,
	enrich,
	partition,
	partitionContextual,
} from "./actions/index.js";
import { Chunk } from "./datatypes/index.js";
import {
	anthropicCompletion,
	geminiCompletion,
	geminiEmbedding,
	openaiCompletion,
	openaiEmbedding,
} from "./providers/index.js";

/** The AI plugin: register this with the runtime to enable all AI providers and actions. */
export const aiPlugin = Plugin.define("ai")
	.withProviders(
		openaiCompletion,
		openaiEmbedding,
		anthropicCompletion,
		geminiCompletion,
		geminiEmbedding,
	)
	.withActions(
		embed,
		chunk,
		chunkSimilarity,
		chunkContextual,
		partition,
		partitionContextual,
		enrich,
	)
	.withDatatypes(Datatypes.define("chunk", Chunk));

export { Embedding } from "@nvisy/core";
export type { ChunkOptions } from "./datatypes/index.js";
export { Chunk } from "./datatypes/index.js";
