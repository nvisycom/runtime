import { z } from "zod";

const ConnectionSchema = z.object({
	type: z.string(),
	credentials: z.unknown(),
	context: z.unknown(),
});

const ConnectionsSchema = z.record(z.uuid(), ConnectionSchema);

export const ExecuteRequest = z.object({
	graph: z.record(z.string(), z.unknown()),
	connections: ConnectionsSchema,
});

export const ValidateRequest = z.object({
	graph: z.record(z.string(), z.unknown()),
	connections: ConnectionsSchema,
});

export const RunIdParam = z.object({ runId: z.uuid() });
