/**
 * Async semaphore for concurrency control.
 * Limits the number of concurrent operations.
 */
export class AsyncSemaphore {
	private permits: number;
	private readonly maxPermits: number;
	private readonly waitQueue: Array<() => void> = [];

	constructor(maxPermits: number) {
		this.maxPermits = maxPermits;
		this.permits = maxPermits;
	}

	/** Acquire a permit. Returns a release function. */
	async acquire(): Promise<() => void> {
		if (this.permits > 0) {
			this.permits--;
			return () => this.release();
		}
		return new Promise<() => void>((resolve) => {
			this.waitQueue.push(() => {
				this.permits--;
				resolve(() => this.release());
			});
		});
	}

	private release(): void {
		this.permits++;
		const next = this.waitQueue.shift();
		if (next) next();
	}

	get availablePermits(): number {
		return this.permits;
	}

	get queueLength(): number {
		return this.waitQueue.length;
	}
}
