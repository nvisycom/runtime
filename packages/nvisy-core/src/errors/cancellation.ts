/**
 * Cancellation error for intentionally aborted operations.
 *
 * @module
 */

import { RuntimeError, type RuntimeErrorOptions } from "./runtime.js";

/**
 * The operation was explicitly cancelled.
 *
 * Cancellation errors are not retryable by default since the
 * cancellation was intentional.
 *
 * @example
 * ```ts
 * if (signal.aborted) {
 *   throw new CancellationError("Operation cancelled by user");
 * }
 * ```
 */
export class CancellationError extends RuntimeError {
	constructor(message = "Operation cancelled", options?: RuntimeErrorOptions) {
		super(message, { retryable: false, ...options });
	}
}
