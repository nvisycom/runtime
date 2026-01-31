import { Effect } from "effect";

export interface FiberPool {
	readonly maxConcurrency: number;
	// TODO: semaphore-based concurrency control
	// TODO: per-node concurrency overrides
}

export const createPool = (
	maxConcurrency: number,
): Effect.Effect<FiberPool> =>
	Effect.succeed({ maxConcurrency });
