import { SqlClient } from "@effect/sql";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Provider, Row, ConnectionError } from "@nvisy/core";
import type { Resumable, JsonValue } from "@nvisy/core";
import { SqlCredentials, SqlParams, SqlCursor } from "./schemas.js";

/** Effect Layer that provides a {@link SqlClient.SqlClient}. */
type SqlLayer = Layer.Layer<SqlClient.SqlClient, unknown>;

/** A managed Effect runtime scoped to a single SQL connection pool. */
type SqlRuntime = ManagedRuntime.ManagedRuntime<SqlClient.SqlClient, unknown>;

/**
 * Configuration for {@link makeSqlProvider}.
 *
 * Each database adapter (pg, mysql, mssql) supplies its own `id` and
 * `makeLayer` implementation; everything else (read, write, lifecycle)
 * is handled by the shared factory.
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
 * All three adapters (Postgres, MySQL, MSSQL) share the same connection
 * lifecycle, keyset-paginated source, and batch-insert sink — only the
 * layer constructor differs.
 *
 * @param config - Database-specific configuration.
 * @returns A {@link Provider.Factory} that produces connected provider instances.
 */
export const makeSqlProvider = (config: SqlProviderConfig) =>
	Provider.Factory({
		credentialSchema: SqlCredentials,
		paramSchema: SqlParams,

		connect: async (credentials, _params) => {
			const runtime = await connectRuntime(config, credentials);

			const builder = Provider.Instance({
				id: config.id,
				dataClass: Row,
				client: runtime,
			})
				.withSource(
					Provider.Source({
						contextSchema: SqlCursor,
						read: readRows,
					}),
				)
				.withSink(Provider.Sink({ write: writeRows }));

			return {
				build(params: SqlParams) {
					const instance = builder.build(params);
					(instance as { disconnect?: () => Promise<void> }).disconnect =
						() => runtime.dispose();
					return instance;
				},
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

/**
 * Keyset-paginated source that yields one {@link Row} at a time.
 *
 * Pages are fetched using a composite `(idColumn, tiebreaker)` cursor
 * for stable ordering across batches. The generator terminates when a
 * batch returns fewer rows than `batchSize`.
 */
async function* readRows(
	runtime: SqlRuntime,
	cursor: SqlCursor,
	params: SqlParams,
): AsyncGenerator<Resumable<Row, SqlCursor>> {
	const { table, columns, idColumn, tiebreaker, batchSize } = params;
	let lastId = cursor.lastId;
	let lastTiebreaker = cursor.lastTiebreaker;

	for (;;) {
		const rows = await runtime.runPromise(
			Effect.gen(function* () {
				const sql = yield* SqlClient.SqlClient;

				const selectCols =
					columns.length > 0
						? sql.literal(columns.map((c) => `"${c}"`).join(", "))
						: sql.literal("*");

				const orderClause = sql.literal(
					`ORDER BY "${idColumn}" ASC, "${tiebreaker}" ASC`,
				);

				if (lastId === null || lastTiebreaker === null) {
					return yield* sql<Record<string, unknown>>`
						SELECT ${selectCols}
						FROM ${sql(table)}
						${orderClause}
						LIMIT ${batchSize}
					`;
				}

				return yield* sql<Record<string, unknown>>`
					SELECT ${selectCols}
					FROM ${sql(table)}
					WHERE (${sql(idColumn)}, ${sql(tiebreaker)}) > (${lastId}, ${lastTiebreaker})
					${orderClause}
					LIMIT ${batchSize}
				`;
			}),
		);

		for (const row of rows) {
			lastId = (row[idColumn] as string | number) ?? null;
			lastTiebreaker = (row[tiebreaker] as string | number) ?? null;

			yield {
				data: new Row(row as Record<string, JsonValue>),
				context: { lastId, lastTiebreaker },
			};
		}

		if (rows.length < batchSize) break;
	}
}

/**
 * Batch-insert sink.
 *
 * Extracts the column map from each {@link Row} and writes them in a
 * single `INSERT INTO … VALUES` statement via `sql.insert()`.
 * Empty batches are silently skipped.
 */
async function writeRows(
	runtime: SqlRuntime,
	items: ReadonlyArray<Row>,
	params: SqlParams,
): Promise<void> {
	if (items.length === 0) return;

	const records = items.map((row) => row.columns as Record<string, unknown>);

	await runtime.runPromise(
		Effect.gen(function* () {
			const sql = yield* SqlClient.SqlClient;
			yield* sql`INSERT INTO ${sql(params.table)} ${sql.insert(records)}`;
		}),
	);
}
