import { createRoute, z } from "@hono/zod-openapi";
import {
	CancelResponseSchema,
	ErrorResponseSchema,
	ExecuteRequestSchema,
	ExecuteResponseSchema,
	RunDetailSchema,
	RunIdParamSchema,
	RunSummarySchema,
	ValidateRequestSchema,
	ValidateResponseSchema,
} from "./graphs-schema.js";

export const executeRoute = createRoute({
	method: "post",
	path: "/api/v1/graphs/execute",
	tags: ["Graphs"],
	summary: "Execute a graph",
	description:
		"Submit a graph for execution. Returns immediately with a run ID.",
	request: {
		body: {
			content: { "application/json": { schema: ExecuteRequestSchema } },
		},
	},
	responses: {
		202: {
			description: "Graph execution started",
			content: { "application/json": { schema: ExecuteResponseSchema } },
		},
	},
});

export const validateRoute = createRoute({
	method: "post",
	path: "/api/v1/graphs/validate",
	tags: ["Graphs"],
	summary: "Validate a graph",
	description: "Compile and validate a graph definition without executing it.",
	request: {
		body: {
			content: { "application/json": { schema: ValidateRequestSchema } },
		},
	},
	responses: {
		200: {
			description: "Validation result",
			content: { "application/json": { schema: ValidateResponseSchema } },
		},
	},
});

export const listRunsRoute = createRoute({
	method: "get",
	path: "/api/v1/graphs",
	tags: ["Graphs"],
	summary: "List in-flight runs",
	responses: {
		200: {
			description: "List of currently executing runs",
			content: { "application/json": { schema: z.array(RunSummarySchema) } },
		},
	},
});

export const getRunRoute = createRoute({
	method: "get",
	path: "/api/v1/graphs/{runId}",
	tags: ["Graphs"],
	summary: "Get run status",
	description: "Get detailed status of a single in-flight run.",
	request: {
		params: RunIdParamSchema,
	},
	responses: {
		200: {
			description: "Run details",
			content: { "application/json": { schema: RunDetailSchema } },
		},
		404: {
			description: "Run not found",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});

export const cancelRunRoute = createRoute({
	method: "delete",
	path: "/api/v1/graphs/{runId}",
	tags: ["Graphs"],
	summary: "Cancel a run",
	description: "Cancel a running graph execution.",
	request: {
		params: RunIdParamSchema,
	},
	responses: {
		200: {
			description: "Run cancelled",
			content: { "application/json": { schema: CancelResponseSchema } },
		},
		404: {
			description: "Run not found or already completed",
			content: { "application/json": { schema: ErrorResponseSchema } },
		},
	},
});
