import { RuntimeError, type ErrorContext } from "#errors/runtime-error.js";

/** The operation was explicitly cancelled. */
export class CancellationError extends RuntimeError {
	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}
