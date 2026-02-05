import { ValidationError } from "@nvisy/core";
import type { z } from "zod";

/**
 * Validate params against a Zod schema, throwing a ValidationError on failure.
 *
 * @param schema - Zod schema to validate against
 * @param params - Parameters to validate
 * @param context - Error context (e.g., "stream params for source node abc")
 * @returns Parsed and typed params
 */
export function validateParams<T extends z.ZodType>(
	schema: T,
	params: unknown,
	context: string,
): z.infer<T> {
	const result = schema.safeParse(params);
	if (!result.success) {
		throw new ValidationError(`Invalid ${context}: ${result.error.message}`, {
			source: "engine",
			retryable: false,
			details: { issues: result.error.issues },
		});
	}
	return result.data;
}
