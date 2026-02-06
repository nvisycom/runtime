/**
 * @module @nvisy/plugin-vector
 *
 * Vector database plugin for the Nvisy runtime.
 *
 * Exposes vector database providers (Pinecone, Qdrant, Milvus, Weaviate, pgvector)
 * and an upsert target stream for writing embeddings to vector stores.
 *
 * @example
 * ```ts
 * import { vectorPlugin } from "@nvisy/plugin-vector";
 *
 * engine.register(vectorPlugin);
 * ```
 */

import { Plugin } from "@nvisy/core";
import {
	milvus,
	pgvectorProvider,
	pinecone,
	qdrant,
	weaviateProvider,
} from "./providers/index.js";
import { upsert } from "./streams/index.js";

/** The Vector plugin: register this with the runtime to enable vector store providers and streams. */
export const vectorPlugin = Plugin.define("vector")
	.withProviders(pinecone, qdrant, milvus, weaviateProvider, pgvectorProvider)
	.withStreams(upsert);

export type { UpsertVector } from "./providers/index.js";
export { VectorClient } from "./providers/index.js";
