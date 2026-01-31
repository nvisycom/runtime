import { RuntimeError, type ErrorContext } from "#errors/runtime-error.js";

/**
 * Could not reach an external service, storage backend, or database.
 *
 * Also covers missing or unregistered connections.
 */
export class ConnectionError extends RuntimeError {
	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}
