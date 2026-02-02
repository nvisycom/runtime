import { z } from "zod";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

/**
 * Parameters for the `sql/rename` action.
 *
 * `mapping` is a `{ oldName: newName }` record. Columns not present
 * in the mapping are passed through unchanged.
 */
const RenameParams = z.object({
	mapping: z.record(z.string(), z.string()),
});

/**
 * Rename columns according to a key mapping.
 *
 * Each entry in `mapping` renames `oldKey -> newKey`. Columns not in
 * the mapping are preserved as-is. Row identity and metadata are kept.
 */
export const rename = Action.withoutClient("rename", {
	types: [Row],
	params: RenameParams,
	transform: async function* (stream, params) {
		for await (const row of stream) {
			const result: Record<string, JsonValue> = {};

			for (const [key, val] of Object.entries(row.columns)) {
				const newKey = params.mapping[key] ?? key;
				result[newKey] = val;
			}

			yield new Row(result, { id: row.id, metadata: row.metadata });
		}
	},
});
