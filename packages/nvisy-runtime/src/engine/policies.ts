/**
 * Execution policies for retry and timeout handling.
 *
 * Both policies wrap Effection {@link Operation}s and compose freely:
 *
 * - {@link withRetry} — retries an operation up to `maxRetries` times
 *   using fixed, exponential, or jittered backoff. Non-retryable
 *   {@link RuntimeError}s bypass retry and propagate immediately.
 * - {@link withTimeout} — races an operation against an Effection
 *   `sleep` timer; if the timer wins, the operation is cancelled and
 *   a caller-supplied fallback value is returned.
 *
 * @module
 */

import { getLogger } from "@logtape/logtape";
import { RuntimeError } from "@nvisy/core";
import { type Operation, race, sleep } from "effection";
import type { RetryPolicy } from "../schema.js";

const logger = getLogger(["nvisy", "engine"]);

/**
 * Wrap an operation with retry logic.
 *
 * Retries are only attempted for errors that are marked as retryable.
 * Non-retryable errors (RuntimeError with `retryable: false`) are
 * thrown immediately without retry.
 *
 * @param fn - Operation factory to retry.
 * @param policy - Retry configuration (maxRetries, backoff strategy, delays).
 * @param nodeId - Node ID for logging.
 * @returns The operation result if successful.
 * @throws The last error if all retries are exhausted.
 *
 * @example
 * ```ts
 * const result = yield* withRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, backoff: "exponential", initialDelayMs: 100, maxDelayMs: 5000 },
 *   "node-123"
 * );
 * ```
 */
export function* withRetry<T>(
	fn: () => Operation<T>,
	policy: RetryPolicy | undefined,
	nodeId: string,
): Operation<T> {
	if (!policy) return yield* fn();

	const { maxRetries, backoff, initialDelayMs, maxDelayMs } = policy;
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return yield* fn();
		} catch (error) {
			lastError = error;

			// Non-retryable errors fail immediately
			if (error instanceof RuntimeError && error.retryable === false) {
				throw error;
			}

			logger.warn("Node {nodeId} attempt {attempt} failed: {error}", {
				nodeId,
				attempt: attempt + 1,
				maxRetries,
				error: error instanceof Error ? error.message : String(error),
			});

			if (attempt < maxRetries) {
				const delay = computeDelay(
					backoff,
					initialDelayMs,
					maxDelayMs,
					attempt,
				);
				yield* sleep(delay);
			}
		}
	}

	throw lastError;
}

/**
 * Compute delay for a retry attempt based on backoff strategy.
 *
 * Strategies:
 * - `fixed`: Always use initialDelayMs
 * - `exponential`: Double the delay each attempt (capped at maxDelayMs)
 * - `jitter`: Random delay between 0 and exponential delay (good for avoiding thundering herd)
 */
function computeDelay(
	backoff: RetryPolicy["backoff"],
	initialDelayMs: number,
	maxDelayMs: number,
	attempt: number,
): number {
	const exponentialDelay = Math.min(initialDelayMs * 2 ** attempt, maxDelayMs);
	switch (backoff) {
		case "fixed":
			return initialDelayMs;
		case "exponential":
			return exponentialDelay;
		case "jitter":
			// Full jitter: random value between 0 and the exponential delay
			// This provides good collision avoidance while maintaining backoff growth
			return Math.floor(Math.random() * exponentialDelay);
	}
}

/**
 * Wrap an operation with a timeout.
 *
 * Uses Effection's `race` to run the operation against a timer.
 * If the timeout expires first, returns the fallback value.
 * The original operation is automatically cancelled by Effection.
 *
 * @param fn - Operation factory to execute.
 * @param timeoutMs - Maximum time to wait (undefined = no timeout).
 * @param fallback - Value to return if timeout expires.
 * @returns The operation result or fallback.
 *
 * @example
 * ```ts
 * const result = yield* withTimeout(
 *   () => slowOperation(),
 *   5000,
 *   { status: "timeout" }
 * );
 * ```
 */
export function* withTimeout<T>(
	fn: () => Operation<T>,
	timeoutMs: number | undefined,
	fallback: T,
): Operation<T> {
	if (!timeoutMs) return yield* fn();

	return yield* race([
		fn(),
		(function* (): Operation<T> {
			yield* sleep(timeoutMs);
			return fallback;
		})(),
	]);
}
