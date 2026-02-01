import { SqlClient } from "@effect/sql";
import { Effect } from "effect";
import { Stream, Row } from "@nvisy/core";
import type { Resumable, JsonValue } from "@nvisy/core";
import { SqlRuntimeClient } from "../providers/base.js";
import { SqlCursor, SqlParams } from "./schemas.js";

/**
 * Keyset-paginated source stream that yields one {@link Row} at a time.
 *
 * Pages are fetched using a composite `(idColumn, tiebreaker)` cursor
 * for stable ordering across batches. The generator terminates when a
 * batch returns fewer rows than `batchSize`.
 */
export const read = Stream.createSource("read", SqlRuntimeClient, {
	types: [Row, SqlCursor, SqlParams],
	reader: readRows,
});

async function* readRows(
	client: SqlRuntimeClient,
	cursor: SqlCursor,
	params: SqlParams,
): AsyncGenerator<Resumable<Row, SqlCursor>> {
	const { table, columns, idColumn, tiebreaker, batchSize } = params;
	let lastId = cursor.lastId;
	let lastTiebreaker = cursor.lastTiebreaker;

	for (;;) {
		const rows = await client.runtime.runPromise(
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
