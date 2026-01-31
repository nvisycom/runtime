import { Schema as S } from "effect";

export const BackoffStrategy = S.Literal("fixed", "exponential", "jitter");

export const RetryPolicy = S.Struct({
	maxRetries: S.optionalWith(S.Number, { default: () => 3 }),
	backoff: S.optionalWith(BackoffStrategy, { default: () => "exponential" as const }),
	initialDelayMs: S.optionalWith(S.Number, { default: () => 1000 }),
	maxDelayMs: S.optionalWith(S.Number, { default: () => 30_000 }),
	retryableErrors: S.optionalWith(S.Array(S.String), { default: () => [] }),
});

export const TimeoutPolicy = S.Struct({
	nodeTimeoutMs: S.optional(S.Number),
	graphTimeoutMs: S.optional(S.Number),
});

export const ConcurrencyPolicy = S.Struct({
	maxGlobal: S.optionalWith(S.Number, { default: () => 10 }),
	maxPerNode: S.optional(S.Number),
});

export type RetryPolicy = S.Schema.Type<typeof RetryPolicy>;
export type TimeoutPolicy = S.Schema.Type<typeof TimeoutPolicy>;
export type ConcurrencyPolicy = S.Schema.Type<typeof ConcurrencyPolicy>;
