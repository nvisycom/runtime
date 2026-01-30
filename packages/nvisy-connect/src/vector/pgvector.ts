import { Effect, Layer } from "effect";
import { Document } from "@langchain/core/documents";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ConnectionError, StorageError, Embedding } from "@nvisy/core";
import { VectorDb } from "#vector/base.js";
import type { VectorDatabase } from "#vector/base.js";
import { NoopEmbeddings } from "#vector/langchain.js";

/** Credentials for connecting to PostgreSQL with pgvector. */
export interface PgVectorCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** pgvector-specific configuration. */
export interface PgVectorConfig {
	collection: string;
	dimensions?: number;
}

/**
 * Layer providing a {@link VectorDatabase} backed by PostgreSQL with pgvector.
 *
 * @example
 * ```ts
 * const layer = PgVectorLayer(
 *   { connectionString: "postgresql://..." },
 *   { collection: "embeddings", dimensions: 1536 },
 * );
 * ```
 */
export const PgVectorLayer = (
	creds: PgVectorCredentials,
	params: PgVectorConfig,
): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(
		VectorDb,
		Effect.gen(function* () {
			const store = yield* Effect.acquireRelease(
				Effect.tryPromise({
					try: () =>
						PGVectorStore.initialize(new NoopEmbeddings(), {
							postgresConnectionOptions: {
								connectionString: creds.connectionString,
							},
							tableName: params.collection,
							...(params.dimensions !== undefined && {
								dimensions: params.dimensions,
							}),
						}),
					catch: (error) =>
						new ConnectionError({
							message:
								error instanceof Error
									? error.message
									: String(error),
							context: { source: "pgvector" },
							cause:
								error instanceof Error ? error : undefined,
						}),
				}),
				(s) => Effect.promise(() => s.end()),
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
								context: { source: "pgvector" },
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

/**
 * Run schema setup / migrations for the pgvector extension and
 * embedding storage table.
 */
export const setupSchema = (
	connectionString: string,
	table: string,
	dimension: number,
): Effect.Effect<void, ConnectionError> =>
	Effect.tryPromise({
		try: async () => {
			const store = await PGVectorStore.initialize(
				new NoopEmbeddings(),
				{
					postgresConnectionOptions: { connectionString },
					tableName: table,
					dimensions: dimension,
				},
			);
			await store.end();
		},
		catch: (error) =>
			new ConnectionError({
				message:
					error instanceof Error ? error.message : String(error),
				context: { source: "pgvector/setupSchema" },
				cause: error instanceof Error ? error : undefined,
			}),
	});
