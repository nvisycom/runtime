import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

const CoerceTarget = Schema.Literal("string", "number", "boolean");

const CoerceParams = Schema.Struct({
	columns: Schema.Record({ key: Schema.String, value: CoerceTarget }),
});
type CoerceParams = typeof CoerceParams.Type;

function coerceValue(
	value: JsonValue | undefined,
	target: "string" | "number" | "boolean",
): JsonValue {
	if (value === null || value === undefined) return null;

	switch (target) {
		case "string":
			return String(value);
		case "number": {
			const n = Number(value);
			return Number.isNaN(n) ? null : n;
		}
		case "boolean":
			return Boolean(value);
	}
}

export const coerce = Action.Define({
	id: "coerce",
	inputClass: Row,
	outputClass: Row,
	schema: CoerceParams,
	execute: async (items, params) => {
		return items.map((row) => {
			const result: Record<string, JsonValue> = { ...row.columns };

			for (const [column, target] of Object.entries(params.columns)) {
				result[column] = coerceValue(result[column], target);
			}

			return new Row(result, {
				id: row.id,
				...(row.metadata !== undefined && { metadata: row.metadata }),
			});
		});
	},
});
