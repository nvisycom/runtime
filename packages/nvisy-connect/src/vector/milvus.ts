import { Effect, Layer } from "effect";
import { Document } from "@langchain/core/documents";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { ConnectionError, StorageError, Embedding } from "@nvisy/core";
import { VectorDb } from "#vector/base.js";
import type { VectorDatabase } from "#vector/base.js";
import { NoopEmbeddings } from "#vector/langchain.js";

/** Credentials for connecting to a Milvus instance. */
export interface MilvusCredentials {
	/** Milvus server address (`host:port`). */
	address: string;
	/** Optional authentication token. */
	token?: string;
}

/** Milvus-specific configuration. */
export interface MilvusConfig {
	collection: string;
}

/**
 * Layer providing a {@link VectorDatabase} backed by Milvus.
 *
 * @example
 * ```ts
 * const layer = MilvusLayer(
 *   { address: "localhost:19530" },
 *   { collection: "embeddings" },
 * );
 * ```
 */
export const MilvusLayer = (
	creds: MilvusCredentials,
	params: MilvusConfig,
): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(
		VectorDb,
		Effect.gen(function* () {
			const store = yield* Effect.acquireRelease(
				Effect.tryPromise({
					try: () =>
						Milvus.fromExistingCollection(new NoopEmbeddings(), {
							url: creds.address,
							collectionName: params.collection,
							...(creds.token !== undefined && {
								password: creds.token,
							}),
						}),
					catch: (error) =>
						new ConnectionError({
							message:
								error instanceof Error
									? error.message
									: String(error),
							context: { source: "milvus" },
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
								context: { source: "milvus" },
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
