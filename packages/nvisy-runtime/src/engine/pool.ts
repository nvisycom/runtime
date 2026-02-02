/**
 * Promise-based semaphore for concurrency control.
 */
export interface FiberPool {
	readonly maxConcurrency: number;
	/**
	 * Run `fn` inside the pool's concurrency limit.
	 * Acquires a permit before starting and releases it when done.
	 */
	readonly withPermit: <T>(fn: () => Promise<T>) => Promise<T>;
}

export const createPool = (maxConcurrency: number): FiberPool => {
	let active = 0;
	const waiting: Array<() => void> = [];

	const acquire = (): Promise<void> => {
		if (active < maxConcurrency) {
			active++;
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			waiting.push(resolve);
		});
	};

	const release = (): void => {
		const next = waiting.shift();
		if (next) {
			next();
		} else {
			active--;
		}
	};

	return {
		maxConcurrency,
		withPermit: async <T>(fn: () => Promise<T>): Promise<T> => {
			await acquire();
			try {
				return await fn();
			} finally {
				release();
			}
		},
	};
};
