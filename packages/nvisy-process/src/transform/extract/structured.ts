import type { AnyDataValue } from "@nvisy/core";

/** Extracts structured data from the input according to a schema. */
export function extractStructured(
	_input: AnyDataValue,
	_schema?: Record<string, unknown>,
): never {
	throw new Error("Not yet implemented");
}
