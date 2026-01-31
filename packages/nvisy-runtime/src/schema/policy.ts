import { Schema } from "effect";

export const BackoffStrategy = Schema.Literal("fixed", "exponential", "jitter");

export const RetryPolicy = Schema.Struct({
	maxRetries: Schema.optionalWith(Schema.Number, { default: () => 3 }),
	backoff: Schema.optionalWith(BackoffStrategy, { default: () => "exponential" as const }),
	initialDelayMs: Schema.optionalWith(Schema.Number, { default: () => 1000 }),
	maxDelayMs: Schema.optionalWith(Schema.Number, { default: () => 30_000 }),
});

export const TimeoutPolicy = Schema.Struct({
	nodeTimeoutMs: Schema.optional(Schema.Number),
	graphTimeoutMs: Schema.optional(Schema.Number),
});

export const ConcurrencyPolicy = Schema.Struct({
	maxGlobal: Schema.optionalWith(Schema.Number, { default: () => 10 }),
	maxPerNode: Schema.optional(Schema.Number),
});

export type RetryPolicy = Schema.Schema.Type<typeof RetryPolicy>;
export type TimeoutPolicy = Schema.Schema.Type<typeof TimeoutPolicy>;
export type ConcurrencyPolicy = Schema.Schema.Type<typeof ConcurrencyPolicy>;
