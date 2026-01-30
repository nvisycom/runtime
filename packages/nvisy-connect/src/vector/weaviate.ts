import { Effect, Layer } from "effect";
import { Document } from "@langchain/core/documents";
import { connectToCustom } from "weaviate-client";
import { WeaviateStore } from "@langchain/weaviate";
import { ConnectionError, StorageError, Embedding } from "@nvisy/core";
import { VectorDb } from "#vector/base.js";
import type { VectorDatabase } from "#vector/base.js";
import { NoopEmbeddings } from "#vector/langchain.js";

/** Credentials for connecting to a Weaviate instance. */
export interface WeaviateCredentials {
	/** Weaviate server URL (e.g. `http://localhost:8080`). */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Weaviate-specific configuration. */
export interface WeaviateConfig {
	collection: string;
}

/**
 * Layer providing a {@link VectorDatabase} backed by Weaviate.
 *
 * @example
 * ```ts
 * const layer = WeaviateLayer(
 *   { url: "http://localhost:8080" },
 *   { collection: "Embeddings" },
 * );
 * ```
 */
export const WeaviateLayer = (
	creds: WeaviateCredentials,
	params: WeaviateConfig,
): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(
		VectorDb,
		Effect.gen(function* () {
			const store = yield* Effect.acquireRelease(
				Effect.tryPromise({
					try: async () => {
						const parsed = new URL(creds.url);
						const client = await connectToCustom({
							httpHost: parsed.hostname,
							httpPort: Number(parsed.port) || 8080,
							httpSecure: parsed.protocol === "https:",
							grpcHost: parsed.hostname,
							grpcPort: 50051,
							grpcSecure: parsed.protocol === "https:",
							...(creds.apiKey !== undefined && {
								authCredentials: creds.apiKey,
							}),
						});
						return WeaviateStore.fromExistingIndex(
							new NoopEmbeddings(),
							{
								client,
								indexName: params.collection,
							},
						);
					},
					catch: (error) =>
						new ConnectionError({
							message:
								error instanceof Error
									? error.message
									: String(error),
							context: { source: "weaviate" },
							cause:
								error instanceof Error ? error : undefined,
						}),
				}),
				() => Effect.void,
			);

			const service: VectorDatabase = {
				write: (items) =>
					Effect.tryPromise({
						try: () => {
							const { vectors, metadata, ids } =
								Embedding.toLangchainBatch(items);
							const docs = metadata.map(
								(m, i) =>
									new Document({
										pageContent: "",
										metadata: m,
										id: ids[i]!,
									}),
							);
							return store.addVectors(vectors, docs, { ids });
						},
						catch: (error) =>
							new StorageError({
								message:
									error instanceof Error
										? error.message
										: String(error),
								context: { source: "weaviate" },
								cause:
									error instanceof Error
										? error
										: undefined,
							}),
					}),
			};

			return service;
		}),
	);
