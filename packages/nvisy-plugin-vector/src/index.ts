/**
 * @module @nvisy/plugin-vector
 *
 * Vector database plugin for the Nvisy runtime.
 *
 * Exposes vector database providers (Pinecone, Qdrant, Milvus, Weaviate, pgvector),
 * embedding streams, and vector search actions for the pipeline.
 */

import { Plugin } from "@nvisy/core";

/** Vector database plugin instance. */
export const vectorPlugin = Plugin.define("vector");
