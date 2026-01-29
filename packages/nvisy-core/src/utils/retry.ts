export interface RetryOptions {
	/** Maximum number of attempts (including the first). Default: 3. */
	maxAttempts?: number;
	/** Initial delay in milliseconds. Default: 1000. */
	delayMs?: number;
	/** Multiplier applied to delay after each attempt. Default: 2. */
	backoffMultiplier?: number;
	/** Maximum delay in milliseconds. Default: 30000. */
	maxDelayMs?: number;
	/** Predicate to decide if the error is retryable. Default: always true. */
	isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxAttempts: 3,
	delayMs: 1000,
	backoffMultiplier: 2,
	maxDelayMs: 30_000,
	isRetryable: () => true,
};

/**
 * Retry a function with exponential backoff.
 * Returns the result on success or throws the last error on exhaustion.
 */
export async function retry<T>(
	fn: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let delay = opts.delayMs;
	let lastError: unknown;

	for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (attempt === opts.maxAttempts || !opts.isRetryable(error)) {
				throw error;
			}
			await sleep(delay);
			delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
		}
	}

	throw lastError;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
