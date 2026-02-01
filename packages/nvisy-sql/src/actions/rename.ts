import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

/**
 * Parameters for the `sql/rename` action.
 *
 * `mapping` is a `{ oldName: newName }` record. Columns not present
 * in the mapping are passed through unchanged.
 */
const RenameParams = Schema.Struct({
	mapping: Schema.Record({ key: Schema.String, value: Schema.String }),
});
type RenameParams = typeof RenameParams.Type;

/**
 * Rename columns according to a key mapping.
 *
 * Each entry in `mapping` renames `oldKey → newKey`. Columns not in
 * the mapping are preserved as-is. Row identity and metadata are kept.
 */
export const rename = Action.Define({
	id: "sql/rename",
	inputClass: Row,
	outputClass: Row,
	schema: RenameParams,
	execute: async (items, params) => {
		return items.map((row) => {
			const result: Record<string, JsonValue> = {};

			for (const [key, val] of Object.entries(row.columns)) {
				const newKey = params.mapping[key] ?? key;
				result[newKey] = val;
			}

			return new Row(result, {
				id: row.id,
				...(row.metadata !== undefined && { metadata: row.metadata }),
			});
		});
	},
});
