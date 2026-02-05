import type { JsonValue } from "@nvisy/core";
import { Action } from "@nvisy/core";
import { z } from "zod";
import { Row } from "../datatypes/index.js";

/** Allowed target types for column coercion. */
const CoerceTarget = z.enum(["string", "number", "boolean"]);

/**
 * Parameters for the `sql/coerce` action.
 *
 * `columns` maps column names to a target type. Columns not listed
 * are passed through unchanged.
 */
const CoerceParams = z.object({
	columns: z.record(z.string(), CoerceTarget),
});

/**
 * Cast a single value to the requested type.
 *
 * - `null` / `undefined` -> `null` regardless of target.
 * - `"number"` on a non-numeric string -> `null`.
 */
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

/**
 * Coerce column values to a target type (`string`, `number`, or `boolean`).
 *
 * Null values remain null regardless of the target. Non-numeric strings
 * coerced to `number` become `null`. Row identity and metadata are preserved.
 */
export const coerce = Action.withoutClient("coerce", {
	types: [Row],
	params: CoerceParams,
	transform: async function* (stream, params) {
		for await (const row of stream) {
			const result: Record<string, JsonValue> = { ...row.columns };

			for (const [column, target] of Object.entries(params.columns)) {
				result[column] = coerceValue(result[column], target);
			}

			yield new Row(result).deriveFrom(row);
		}
	},
});
