import { getLogger } from "@logtape/logtape";
import { Row, RuntimeError, StreamFactory } from "@nvisy/core";
import { KyselyClient } from "../providers/client.js";
import { SqlParams } from "./schemas.js";

const logger = getLogger(["nvisy", "sql"]);

/**
 * Per-item insert target stream.
 *
 * Extracts the column map from each {@link Row} and writes it via
 * a Kysely INSERT. Each element piped through the writer triggers
 * an individual INSERT statement.
 */
export const write = StreamFactory.createTarget("write", KyselyClient, {
	types: [Row, SqlParams],
	writer: (client, params) => async (item: Row) => {
		const record = item.columns as Record<string, unknown>;
		if (Object.keys(record).length === 0) return;

		try {
			await client.db.insertInto(params.table).values(record).execute();
			logger.debug("Inserted row into {table}", { table: params.table });
		} catch (error) {
			logger.error("Write failed on {table}: {error}", {
				table: params.table,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new RuntimeError(
				`Write failed: ${error instanceof Error ? error.message : String(error)}`,
				{
					source: "sql/write",
					retryable: false,
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	},
});
