import { getLogger } from "@logtape/logtape";
import type { JsonValue, Resumable } from "@nvisy/core";
import { Row, RuntimeError, StreamFactory } from "@nvisy/core";
import { type SqlBool, sql } from "kysely";
import { KyselyClient } from "../providers/base.js";
import { SqlCursor, SqlParams } from "./schemas.js";

const logger = getLogger(["nvisy", "sql"]);

/**
 * Keyset-paginated source stream that yields one {@link Row} at a time.
 *
 * Pages are fetched using a composite `(idColumn, tiebreaker)` cursor
 * for stable ordering across batches. The stream terminates when a
 * batch returns fewer rows than `batchSize`.
 */
export const read = StreamFactory.createSource("read", KyselyClient, {
	types: [Row, SqlCursor, SqlParams],
	reader: (client, cursor, params) => readStream(client, cursor, params),
});

async function* readStream(
	client: KyselyClient,
	cursor: SqlCursor,
	params: SqlParams,
): AsyncIterable<Resumable<Row, SqlCursor>> {
	const { table, columns, idColumn, tiebreaker, batchSize } = params;
	const { ref } = client.db.dynamic;

	logger.debug("Read stream opened on {table}", {
		table,
		idColumn,
		tiebreaker,
		batchSize,
	});

	let lastId = cursor.lastId;
	let lastTiebreaker = cursor.lastTiebreaker;
	let totalRows = 0;

	while (true) {
		let rows: ReadonlyArray<Record<string, unknown>>;

		try {
			let query = client.db
				.selectFrom(table)
				.orderBy(ref(idColumn), "asc")
				.orderBy(ref(tiebreaker), "asc")
				.limit(batchSize);

			if (columns.length > 0) {
				query = query.select(columns.map((c) => ref(c)));
			} else {
				query = query.selectAll();
			}

			if (lastId !== null && lastTiebreaker !== null) {
				query = query.where(
					sql<SqlBool>`(${sql.ref(idColumn)}, ${sql.ref(tiebreaker)}) > (${lastId}, ${lastTiebreaker})`,
				);
			}

			rows = await query.execute();
			logger.debug("Read batch returned {count} rows from {table}", {
				count: rows.length,
				table,
			});
		} catch (error) {
			logger.error("Read failed on {table}: {error}", {
				table,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new RuntimeError(
				`Read failed: ${error instanceof Error ? error.message : String(error)}`,
				{
					source: "sql/read",
					retryable: false,
					cause: error instanceof Error ? error : undefined,
				},
			);
		}

		for (const row of rows) {
			totalRows++;
			lastId = (row[idColumn] as string | number) ?? null;
			lastTiebreaker = (row[tiebreaker] as string | number) ?? null;
			yield {
				data: new Row(row as Record<string, JsonValue>),
				context: { lastId, lastTiebreaker } as SqlCursor,
			};
		}

		if (rows.length < batchSize) break;
	}

	logger.debug("Read stream closed on {table}, {totalRows} rows yielded", {
		table,
		totalRows,
	});
}
