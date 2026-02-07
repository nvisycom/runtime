/**
 * Connection error for unreachable external services.
 *
 * @module
 */

import { type ErrorContext, RuntimeError } from "./runtime.js";

/**
 * Could not reach an external service, storage backend, or database.
 *
 * Also covers missing or unregistered connections. Connection errors
 * are retryable by default since network issues are often transient.
 *
 * @example
 * ```ts
 * throw new ConnectionError("Database connection timeout", {
 *   source: "postgres",
 *   details: { host: "db.example.com", port: 5432 },
 * });
 *
 * // Wrap provider connection failures
 * catch (error) {
 *   throw ConnectionError.wrap(error, { source: "postgres" });
 * }
 * ```
 */
export class ConnectionError extends RuntimeError {
	/**
	 * Wrap an unknown error as a ConnectionError.
	 *
	 * If the error is already a ConnectionError, returns it unchanged.
	 * Otherwise, creates a new ConnectionError with the original as cause.
	 *
	 * @param error - The error to wrap.
	 * @param context - Optional context (source, details).
	 */
	static override wrap(
		error: unknown,
		context?: ErrorContext,
	): ConnectionError {
		if (error instanceof ConnectionError) return error;
		const message = error instanceof Error ? error.message : String(error);
		const cause = error instanceof Error ? error : undefined;
		return new ConnectionError(`Connection failed: ${message}`, {
			...context,
			...(cause && { cause }),
		});
	}

	/**
	 * Create a connection error for missing connections.
	 *
	 * @param connectionId - The connection ID that wasn't found.
	 * @param source - The component that raised the error.
	 */
	static notFound(connectionId: string, source?: string): ConnectionError {
		return new ConnectionError(`Connection not found: ${connectionId}`, {
			...(source && { source }),
			retryable: false,
		});
	}
}
