import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

const RenameParams = Schema.Struct({
	mapping: Schema.Record({ key: Schema.String, value: Schema.String }),
});
type RenameParams = typeof RenameParams.Type;

export const rename = Action.Define({
	id: "rename",
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
