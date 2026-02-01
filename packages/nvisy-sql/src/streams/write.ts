import { SqlClient } from "@effect/sql";
import { Effect } from "effect";
import { Stream, Row } from "@nvisy/core";
import { SqlRuntimeClient } from "../providers/base.js";
import { SqlParams } from "./schemas.js";

/**
 * Batch-insert target stream.
 *
 * Extracts the column map from each {@link Row} and writes them in a
 * single `INSERT INTO … VALUES` statement via `sql.insert()`.
 * Empty batches are silently skipped.
 */
export const write = Stream.createTarget("write", SqlRuntimeClient, {
	types: [Row, SqlParams],
	writer: writeRows,
});

async function writeRows(
	client: SqlRuntimeClient,
	items: ReadonlyArray<Row>,
	params: SqlParams,
): Promise<void> {
	if (items.length === 0) return;

	const records = items.map((row) => row.columns as Record<string, unknown>);

	await client.runtime.runPromise(
		Effect.gen(function* () {
			const sql = yield* SqlClient.SqlClient;
			yield* sql`INSERT INTO ${sql(params.table)} ${sql.insert(records)}`;
		}),
	);
}
