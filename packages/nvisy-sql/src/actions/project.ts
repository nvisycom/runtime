import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

/**
 * Parameters for the `sql/project` action.
 *
 * Provide **either** `keep` (include only these columns) or `drop`
 * (exclude these columns). Columns not present in the row are ignored.
 */
const ProjectParams = Schema.Union(
	Schema.Struct({
		keep: Schema.Array(Schema.String),
	}),
	Schema.Struct({
		drop: Schema.Array(Schema.String),
	}),
);
type ProjectParams = typeof ProjectParams.Type;

/**
 * Project (select / exclude) columns from each row.
 *
 * Use `{ keep: [...] }` to retain only named columns, or
 * `{ drop: [...] }` to remove named columns. Row identity and
 * metadata are preserved.
 */
export const project = Action.withoutClient("project", {
	types: [Row],
	params: ProjectParams,
	execute: async (items, params) => {
		return items.map((row) => {
			const cols = row.columns;
			let projected: Record<string, JsonValue>;

			if ("keep" in params) {
				projected = {};
				for (const key of params.keep) {
					if (key in cols) {
						projected[key] = cols[key]!;
					}
				}
			} else {
				const dropSet = new Set(params.drop);
				projected = {};
				for (const [key, val] of Object.entries(cols)) {
					if (!dropSet.has(key)) {
						projected[key] = val;
					}
				}
			}

			return new Row(projected, { id: row.id, metadata: row.metadata });
		});
	},
});
