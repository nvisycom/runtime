import { SqlClient } from "@effect/sql";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Provider, Row, ConnectionError } from "@nvisy/core";
import type { Resumable, JsonValue } from "@nvisy/core";
import { SqlCredentials, SqlParams, SqlCursor } from "./schemas.js";

type SqlLayer = Layer.Layer<SqlClient.SqlClient, unknown>;
type Runtime = ManagedRuntime.ManagedRuntime<SqlClient.SqlClient, unknown>;

/**
 * Create a SQL provider factory parameterised by a database-specific layer
 * constructor. This avoids duplicating read/write logic across pg/mysql/mssql.
 */
export const makeSqlProvider = (config: {
	id: string;
	makeLayer: (creds: SqlCredentials) => SqlLayer;
}) =>
	Provider.Factory({
		credentialSchema: SqlCredentials,
		paramSchema: SqlParams,

		connect: async (credentials, _params) => {
			const layer = config.makeLayer(credentials);
			const runtime = ManagedRuntime.make(layer);

			// Verify the connection is usable by acquiring the client once.
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

			// Return a custom buildable that attaches disconnect to the result.
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

async function* readRows(
	runtime: Runtime,
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

		if (rows.length < batchSize) {
			break;
		}
	}
}

async function writeRows(
	runtime: Runtime,
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
