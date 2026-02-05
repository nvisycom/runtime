import { getLogger } from "@logtape/logtape";
import { RuntimeError } from "@nvisy/core";
import { type Operation, race, sleep } from "effection";
import type { RetryPolicy } from "../schema.js";

const logger = getLogger(["nvisy", "engine"]);

/**
 * Wrap an operation with retry logic based on the provided policy.
 *
 * - Non-retryable errors (RuntimeError with retryable=false) are thrown immediately
 * - Retryable errors trigger backoff delays between attempts
 * - After all retries exhausted, the last error is thrown
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

function computeDelay(
	backoff: RetryPolicy["backoff"],
	initialDelayMs: number,
	maxDelayMs: number,
	attempt: number,
): number {
	switch (backoff) {
		case "fixed":
			return initialDelayMs;
		case "exponential":
			return Math.min(initialDelayMs * 2 ** attempt, maxDelayMs);
		case "jitter":
			return (
				Math.min(initialDelayMs * 2 ** attempt, maxDelayMs) * Math.random()
			);
	}
}

/**
 * Wrap an operation with a timeout. Returns the fallback value if timeout expires.
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
