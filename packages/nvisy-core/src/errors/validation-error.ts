import { RuntimeError, type ErrorContext } from "#errors/runtime-error.js";

/**
 * Input did not pass schema or business rules.
 *
 * Also covers invalid workflow and pipeline definitions.
 */
export class ValidationError extends RuntimeError {
	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}
