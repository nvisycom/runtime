import { z } from "zod";

export const ExecuteRequest = z.object({
	graph: z.record(z.string(), z.unknown()),
	config: z.record(z.string(), z.unknown()).optional(),
});

export const ValidateRequest = z.object({
	graph: z.record(z.string(), z.unknown()),
});

export const RunIdParam = z.object({ runId: z.string() });
