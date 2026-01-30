import { Effect, Layer } from "effect";
import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { ConnectionError, StorageError, Embedding } from "@nvisy/core";
import { VectorDb } from "#vector/base.js";
import type { VectorDatabase } from "#vector/base.js";
import { NoopEmbeddings } from "#vector/langchain.js";

/** Credentials for connecting to Pinecone. */
export interface PineconeCredentials {
	/** Pinecone API key. */
	apiKey: string;
}

/** Pinecone-specific configuration. */
export interface PineconeConfig {
	collection: string;
	namespace?: string;
}

/**
 * Layer providing a {@link VectorDatabase} backed by Pinecone.
 *
 * @example
 * ```ts
 * const layer = PineconeLayer(
 *   { apiKey: "..." },
 *   { collection: "embeddings" },
 * );
 * ```
 */
export const PineconeLayer = (
	creds: PineconeCredentials,
	params: PineconeConfig,
): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(
		VectorDb,
		Effect.gen(function* () {
			const store = yield* Effect.acquireRelease(
				Effect.tryPromise({
					try: async () => {
						const client = new Pinecone({ apiKey: creds.apiKey });
						const index = client.index(params.collection);
						return PineconeStore.fromExistingIndex(
							new NoopEmbeddings(),
							{
								pineconeIndex: index,
								...(params.namespace !== undefined && {
									namespace: params.namespace,
								}),
							},
						);
					},
					catch: (error) =>
						new ConnectionError({
							message:
								error instanceof Error
									? error.message
									: String(error),
							context: { source: "pinecone" },
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
								context: { source: "pinecone" },
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
