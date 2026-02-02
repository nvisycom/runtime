import { RuntimeError, type ErrorContext } from "./runtime-error.js";

/** The operation was explicitly cancelled. */
export class CancellationError extends RuntimeError {
	constructor(message: string, context?: ErrorContext) {
		super(message, context);
	}
}
