import { Effect } from "effect";

export interface FiberPool {
	readonly maxConcurrency: number;
	/**
	 * Run `effect` inside the pool's concurrency limit.
	 * Acquires a permit before starting and releases it when done.
	 */
	readonly withPermit: <A, E>(
		effect: Effect.Effect<A, E>,
	) => Effect.Effect<A, E>;
}

export const createPool = (
	maxConcurrency: number,
): Effect.Effect<FiberPool> =>
	Effect.gen(function* () {
		const semaphore = yield* Effect.makeSemaphore(maxConcurrency);
		return {
			maxConcurrency,
			withPermit: (effect) => semaphore.withPermits(1)(effect),
		};
	});
