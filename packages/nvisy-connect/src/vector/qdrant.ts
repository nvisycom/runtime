import { Effect, Layer } from "effect";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ConnectionError, StorageError } from "@nvisy/core";
import type { Embedding } from "@nvisy/core";
import { VectorDb } from "#vector/base.js";
import type { VectorDatabase } from "#vector/base.js";
import { NoopEmbeddings, toVectorsAndDocs } from "#vector/langchain.js";

/** Credentials for connecting to a Qdrant instance. */
export interface QdrantCredentials {
	/** Qdrant server URL. */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Qdrant-specific configuration. */
export interface QdrantConfig {
	collection: string;
}

/**
 * Layer providing a {@link VectorDatabase} backed by Qdrant.
 *
 * @example
 * ```ts
 * const layer = QdrantLayer(
 *   { url: "http://localhost:6333" },
 *   { collection: "embeddings" },
 * );
 * ```
 */
export const QdrantLayer = (
	creds: QdrantCredentials,
	params: QdrantConfig,
): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(
		VectorDb,
		Effect.gen(function* () {
			const store = yield* Effect.acquireRelease(
				Effect.tryPromise({
					try: () =>
						QdrantVectorStore.fromExistingCollection(
							new NoopEmbeddings(),
							{
								url: creds.url,
								collectionName: params.collection,
								...(creds.apiKey !== undefined && {
									apiKey: creds.apiKey,
								}),
							},
						),
					catch: (error) =>
						new ConnectionError({
							message:
								error instanceof Error
									? error.message
									: String(error),
							context: { source: "qdrant" },
							cause:
								error instanceof Error ? error : undefined,
						}),
				}),
				() => Effect.void,
			);

			const service: VectorDatabase = {
				write: (items: ReadonlyArray<Embedding>) =>
					Effect.tryPromise({
						try: async () => {
							const { vectors, documents, ids } =
								toVectorsAndDocs(items);
							await store.addVectors(vectors, documents, { ids });
						},
						catch: (error) =>
							new StorageError({
								message:
									error instanceof Error
										? error.message
										: String(error),
								context: { source: "qdrant" },
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
