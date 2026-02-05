import type { JsonValue } from "@nvisy/core";
import { Action, Row } from "@nvisy/core";
import { z } from "zod";

/** Supported comparison operators for a single filter condition. */
const Operator = z.enum([
	"eq",
	"neq",
	"gt",
	"gte",
	"lt",
	"lte",
	"in",
	"notIn",
	"isNull",
	"isNotNull",
]);
type Operator = z.infer<typeof Operator>;

/** A single predicate: `column <op> value`. */
const FilterCondition = z.object({
	column: z.string(),
	op: Operator,
	value: z.unknown().optional(),
});

/**
 * Parameters for the `sql/filter` action.
 *
 * @param conditions Array of predicates applied to each row.
 * @param mode Combine with `"and"` (default) or `"or"`.
 */
const FilterParams = z.object({
	conditions: z.array(FilterCondition),
	mode: z.enum(["and", "or"]).optional(),
});

/** Evaluate a single {@link FilterCondition} against a row. */
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
			return (
				typeof val === "number" &&
				typeof condition.value === "number" &&
				val > condition.value
			);
		case "gte":
			return (
				typeof val === "number" &&
				typeof condition.value === "number" &&
				val >= condition.value
			);
		case "lt":
			return (
				typeof val === "number" &&
				typeof condition.value === "number" &&
				val < condition.value
			);
		case "lte":
			return (
				typeof val === "number" &&
				typeof condition.value === "number" &&
				val <= condition.value
			);
		case "in":
			return (
				Array.isArray(condition.value) &&
				(condition.value as JsonValue[]).includes(val as JsonValue)
			);
		case "notIn":
			return (
				Array.isArray(condition.value) &&
				!(condition.value as JsonValue[]).includes(val as JsonValue)
			);
		case "isNull":
			return val === null || val === undefined;
		case "isNotNull":
			return val !== null && val !== undefined;
	}
}

/**
 * Filter rows by a set of column-level predicates.
 *
 * Conditions are combined with AND (default) or OR. Supports equality,
 * comparison, set membership, and null checks.
 */
export const filter = Action.withoutClient("filter", {
	types: [Row],
	params: FilterParams,
	transform: async function* (stream, params) {
		const mode = params.mode ?? "and";
		for await (const row of stream) {
			const match =
				mode === "and"
					? params.conditions.every((c) => matchCondition(row, c))
					: params.conditions.some((c) => matchCondition(row, c));
			if (match) yield row;
		}
	},
});
