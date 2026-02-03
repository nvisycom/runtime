import { z } from "zod";

export const BackoffStrategy = z.enum(["fixed", "exponential", "jitter"]);

export const RetryPolicy = z.object({
	maxRetries: z.number().default(3),
	backoff: BackoffStrategy.default("exponential"),
	initialDelayMs: z.number().default(1000),
	maxDelayMs: z.number().default(30_000),
});

export const TimeoutPolicy = z.object({
	nodeTimeoutMs: z.number().optional(),
	graphTimeoutMs: z.number().optional(),
});

export const ConcurrencyPolicy = z.object({
	maxGlobal: z.number().default(10),
	maxPerNode: z.number().optional(),
});

export type RetryPolicy = z.infer<typeof RetryPolicy>;
export type TimeoutPolicy = z.infer<typeof TimeoutPolicy>;
export type ConcurrencyPolicy = z.infer<typeof ConcurrencyPolicy>;
