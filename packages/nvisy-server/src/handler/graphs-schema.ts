import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z.object({
	status: z.number(),
	error: z.string(),
	requestId: z.string().optional(),
});

export const ConnectionSchema = z.object({
	type: z.string(),
	credentials: z.unknown(),
	context: z.unknown(),
});

export const ConnectionsSchema = z.record(z.uuid(), ConnectionSchema);

export const GraphSchema = z.record(z.string(), z.unknown());

export const ExecuteRequestSchema = z.object({
	graph: GraphSchema,
	connections: ConnectionsSchema,
});

export const ValidateRequestSchema = z.object({
	graph: GraphSchema,
	connections: ConnectionsSchema,
});

export const ExecuteResponseSchema = z.object({
	runId: z.string(),
});

export const ValidateResponseSchema = z.object({
	valid: z.boolean(),
	errors: z.array(z.string()),
});

export const RunStatusSchema = z.enum([
	"pending",
	"running",
	"completed",
	"failed",
	"cancelled",
]);

export const RunSummarySchema = z.object({
	runId: z.string(),
	status: RunStatusSchema,
	startedAt: z.string(),
	completedAt: z.string().optional(),
});

export const NodeProgressSchema = z.object({
	nodeId: z.string(),
	status: z.enum(["pending", "running", "completed", "failed"]),
	itemsProcessed: z.number(),
	error: z.string().optional(),
});

export const NodeResultSchema = z.object({
	nodeId: z.string(),
	status: z.enum(["success", "failure", "skipped"]),
	itemsProcessed: z.number(),
	error: z.string().optional(),
});

export const RunResultSchema = z.object({
	runId: z.string(),
	status: z.enum(["success", "partial_failure", "failure"]),
	nodes: z.array(NodeResultSchema),
});

export const RunDetailSchema = z.object({
	runId: z.string(),
	status: RunStatusSchema,
	startedAt: z.string(),
	completedAt: z.string().optional(),
	nodeProgress: z.record(z.string(), NodeProgressSchema),
	result: RunResultSchema.optional(),
	error: z.string().optional(),
});

export const CancelResponseSchema = z.object({
	runId: z.string(),
	cancelled: z.boolean(),
});

export const RunIdParamSchema = z.object({
	runId: z.uuid().openapi({ param: { name: "runId", in: "path" } }),
});
