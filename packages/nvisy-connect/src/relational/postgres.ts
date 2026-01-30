import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { RelationalDb } from "#relational/base.js";
import type { RelationalDatabase } from "#relational/base.js";

/** Credentials for connecting to PostgreSQL. */
export interface PostgresCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** PostgreSQL-specific configuration. */
export interface PostgresConfig {
	table: string;
	schema?: string;
	batchSize?: number;
}

/**
 * Layer providing a {@link RelationalDatabase} backed by PostgreSQL.
 *
 * @example
 * ```ts
 * const layer = PostgresLayer(
 *   { connectionString: "postgresql://..." },
 *   { table: "documents", schema: "public" },
 * );
 * ```
 */
export const PostgresLayer = (
	_creds: PostgresCredentials,
	_params: PostgresConfig,
): Layer.Layer<RelationalDb, ConnectionError> =>
	Layer.scoped(
		RelationalDb,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: establish pg connection pool
				const service: RelationalDatabase = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "postgres" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "postgres" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
