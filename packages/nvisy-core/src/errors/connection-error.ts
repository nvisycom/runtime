import { RuntimeError, type ErrorContext } from "./runtime-error.js";

/**
 * Could not reach an external service, storage backend, or database.
 *
 * Also covers missing or unregistered connections.
 */
export class ConnectionError extends RuntimeError {
	constructor(message: string, context?: ErrorContext) {
		super(message, context);
	}
}
