import { z } from "zod";

export const HealthResponse = z.object({
	status: z.literal("ok"),
});

export const ReadyResponse = z.object({
	status: z.enum(["ready", "unavailable"]),
});
