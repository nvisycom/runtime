import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { RelationalDb } from "#relational/base.js";
import type { RelationalDatabase } from "#relational/base.js";

/** Credentials for connecting to MySQL. */
export interface MySQLCredentials {
	/** Database server host. */
	host: string;
	/** Database server port. */
	port: number;
	/** Database user. */
	user: string;
	/** Database password. */
	password: string;
	/** Database name. */
	database: string;
}

/** MySQL-specific configuration. */
export interface MySQLConfig {
	table: string;
	schema?: string;
	batchSize?: number;
}

/**
 * Layer providing a {@link RelationalDatabase} backed by MySQL.
 *
 * @example
 * ```ts
 * const layer = MySQLLayer(
 *   { host: "localhost", port: 3306, user: "root", password: "...", database: "mydb" },
 *   { table: "documents" },
 * );
 * ```
 */
export const MySQLLayer = (
	_creds: MySQLCredentials,
	_params: MySQLConfig,
): Layer.Layer<RelationalDb, ConnectionError> =>
	Layer.scoped(
		RelationalDb,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: establish MySQL connection pool
				const service: RelationalDatabase = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "mysql" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "mysql" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
