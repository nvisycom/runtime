import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z.object({
	status: z.literal("ok"),
});

export const ReadyResponseSchema = z.object({
	status: z.enum(["ready", "unavailable"]),
});
