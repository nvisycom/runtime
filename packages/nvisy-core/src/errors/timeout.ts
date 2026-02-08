/**
 * Timeout error for operations that exceed their time limit.
 *
 * @module
 */

import type { RuntimeErrorOptions } from "./runtime.js";
import { RuntimeError } from "./runtime.js";

/**
 * Thrown when an operation exceeds its time limit.
 *
 * Defaults to `retryable: true` because timeouts are typically transient.
 * The engine handles retry timing via its backoff policies — this class
 * does not carry a `retryAfterMs` field.
 */
export class TimeoutError extends RuntimeError {
	constructor(message: string, options?: RuntimeErrorOptions) {
		super(message, { retryable: true, ...options });
	}
}
