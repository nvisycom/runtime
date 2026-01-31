import { Schema } from "effect";
import { Action, Row } from "@nvisy/core";
import type { JsonValue } from "@nvisy/core";

const Operator = Schema.Literal("eq", "neq", "gt", "gte", "lt", "lte", "in", "notIn", "isNull", "isNotNull");
type Operator = typeof Operator.Type;

const FilterCondition = Schema.Struct({
	column: Schema.String,
	op: Operator,
	value: Schema.optional(Schema.Unknown),
});

const FilterParams = Schema.Struct({
	conditions: Schema.Array(FilterCondition),
	mode: Schema.optional(Schema.Literal("and", "or")),
});
type FilterParams = typeof FilterParams.Type;

function matchCondition(
	row: Row,
	condition: { column: string; op: Operator; value?: unknown },
): boolean {
	const val = row.get(condition.column);

	switch (condition.op) {
		case "eq":
			return val === condition.value;
		case "neq":
			return val !== condition.value;
		case "gt":
			return typeof val === "number" && typeof condition.value === "number" && val > condition.value;
		case "gte":
			return typeof val === "number" && typeof condition.value === "number" && val >= condition.value;
		case "lt":
			return typeof val === "number" && typeof condition.value === "number" && val < condition.value;
		case "lte":
			return typeof val === "number" && typeof condition.value === "number" && val <= condition.value;
		case "in":
			return Array.isArray(condition.value) && (condition.value as JsonValue[]).includes(val as JsonValue);
		case "notIn":
			return Array.isArray(condition.value) && !(condition.value as JsonValue[]).includes(val as JsonValue);
		case "isNull":
			return val === null || val === undefined;
		case "isNotNull":
			return val !== null && val !== undefined;
	}
}

export const filter = Action.Define({
	id: "filter",
	inputClass: Row,
	outputClass: Row,
	schema: FilterParams,
	execute: async (items, params) => {
		const mode = params.mode ?? "and";

		return items.filter((row) => {
			if (mode === "and") {
				return params.conditions.every((c) => matchCondition(row, c));
			}
			return params.conditions.some((c) => matchCondition(row, c));
		});
	},
});
