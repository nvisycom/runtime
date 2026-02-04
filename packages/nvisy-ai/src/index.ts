/**
 * @module @nvisy/ai
 *
 * AI provider module for the Nvisy runtime.
 *
 * Exposes LLM providers (OpenAI, Anthropic, Gemini), embedding generation,
 * chunking, partitioning, and enrichment actions for AI-powered pipelines.
 *
 * Backed by the Vercel AI SDK for unified provider access.
 *
 * @example
 * ```ts
 * import { aiModule } from "@nvisy/ai";
 *
 * engine.register(aiModule);
 * ```
 */

import { Module } from "@nvisy/core";
import {
	chunk,
	chunkContextual,
	chunkSimilarity,
	embed,
	enrich,
	partition,
	partitionContextual,
} from "./actions/index.js";
import {
	anthropicCompletion,
	geminiCompletion,
	geminiEmbedding,
	openaiCompletion,
	openaiEmbedding,
} from "./providers/index.js";

/** The AI module: register this with the runtime to enable all AI providers and actions. */
export const aiModule = Module.define("ai")
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
	);
