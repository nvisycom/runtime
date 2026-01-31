import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

const ProjectParams = Schema.Union(
	Schema.Struct({
		keep: Schema.Array(Schema.String),
	}),
	Schema.Struct({
		drop: Schema.Array(Schema.String),
	}),
);
type ProjectParams = typeof ProjectParams.Type;

export const project = Action.Define({
	id: "project",
	inputClass: Row,
	outputClass: Row,
	schema: ProjectParams,
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

			return new Row(projected, {
				id: row.id,
				...(row.metadata !== undefined && { metadata: row.metadata }),
			});
		});
	},
});
