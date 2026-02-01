import { SqlClient } from "@effect/sql";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Provider, ConnectionError } from "@nvisy/core";
import { SqlCredentials } from "./schemas.js";
export type { SqlCredentials } from "./schemas.js";

/** Effect Layer that provides a {@link SqlClient.SqlClient}. */
type SqlLayer = Layer.Layer<SqlClient.SqlClient, unknown>;

/** A managed Effect runtime scoped to a single SQL connection pool. */
export type SqlRuntime = ManagedRuntime.ManagedRuntime<SqlClient.SqlClient, unknown>;

/**
 * Wrapper class around {@link SqlRuntime} that provides a concrete class
 * reference for runtime client-type verification.
 *
 * `SqlRuntime` is a type alias (not a class), so it cannot be used as a
 * `clientClass` value. This wrapper gives the runtime something to check
 * with `instanceof`.
 */
export class SqlRuntimeClient {
	readonly runtime: SqlRuntime;
	constructor(runtime: SqlRuntime) {
		this.runtime = runtime;
	}
}

/**
 * Configuration for {@link makeSqlProvider}.
 *
 * Each database adapter (pg, mysql, mssql) supplies its own `id` and
 * `makeLayer` implementation; everything else (lifecycle) is handled
 * by the shared factory.
 */
export interface SqlProviderConfig {
	/** Unique provider identifier (e.g. `"sql/postgres"`). */
	readonly id: string;
	/** Builds the database-specific {@link SqlClient.SqlClient} layer from credentials. */
	readonly makeLayer: (creds: SqlCredentials) => SqlLayer;
}

/**
 * Create a SQL provider factory parameterised by a database-specific
 * {@link SqlClient.SqlClient} layer constructor.
 *
 * The provider only manages the client lifecycle (connect/disconnect).
 * Streams handle reading/writing separately.
 */
export const makeSqlProvider = (config: SqlProviderConfig) =>
	Provider.withAuthentication(config.id, {
		credentials: SqlCredentials,
		connect: async (credentials) => {
			const runtime = await connectRuntime(config, credentials);
			return {
				client: new SqlRuntimeClient(runtime),
				disconnect: () => runtime.dispose(),
			};
		},
	});

/**
 * Bootstrap a {@link ManagedRuntime} from credentials and verify the
 * connection is usable by acquiring the {@link SqlClient.SqlClient} once.
 *
 * If the initial connection fails the runtime is disposed before the
 * error propagates, preventing leaked resources.
 */
async function connectRuntime(
	config: SqlProviderConfig,
	credentials: SqlCredentials,
): Promise<SqlRuntime> {
	const layer = config.makeLayer(credentials);
	const runtime = ManagedRuntime.make(layer);

	try {
		await runtime.runPromise(
			Effect.gen(function* () {
				yield* SqlClient.SqlClient;
			}),
		);
	} catch (error) {
		await runtime.dispose();
		throw new ConnectionError(
			`Failed to connect to ${config.id}: ${error instanceof Error ? error.message : String(error)}`,
			{ source: config.id, retryable: true },
			error instanceof Error ? error : undefined,
		);
	}

	return runtime;
}
