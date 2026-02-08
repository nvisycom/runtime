/**
 * Validation error for input that fails schema or business rules.
 *
 * @module
 */

import { RuntimeError, type RuntimeErrorOptions } from "./runtime.js";

/**
 * Input did not pass schema or business rules.
 *
 * Also covers invalid workflow and pipeline definitions.
 * Validation errors are not retryable by default since the same
 * input will fail validation again.
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid graph definition", { source: "compiler" });
 *
 * // Use factory for common "not found" pattern
 * throw ValidationError.notFound("myAction", "action", "registry");
 * ```
 */
export class ValidationError extends RuntimeError {
	constructor(message: string, options?: RuntimeErrorOptions) {
		super(message, { retryable: false, ...options });
	}

	/**
	 * Create a "not found" validation error.
	 *
	 * @param name - The name that wasn't found.
	 * @param type - The type of thing (e.g., "action", "provider", "stream").
	 * @param source - The component that raised the error.
	 */
	static notFound(
		name: string,
		type: string,
		source?: string,
	): ValidationError {
		return new ValidationError(`Unknown ${type}: ${name}`, {
			...(source && { source }),
		});
	}

	/**
	 * Create a validation error for parse failures.
	 *
	 * @param message - The parse error message.
	 * @param source - The component that raised the error.
	 */
	static parse(message: string, source?: string): ValidationError {
		return new ValidationError(`Parse error: ${message}`, {
			...(source && { source }),
		});
	}
}
