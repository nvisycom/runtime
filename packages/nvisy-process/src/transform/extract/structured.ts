import type { AnyData } from "@nvisy/core";

/** Extracts structured data from the input according to a schema. */
export function extractStructured(
	_input: AnyData,
	_schema?: Record<string, unknown>,
): never {
	throw new Error("Not yet implemented");
}
