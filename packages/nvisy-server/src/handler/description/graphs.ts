import { describeRoute, resolver } from "hono-openapi";
import {
	CancelResponse,
	ErrorResponse,
	ExecuteResponse,
	RunDetail,
	RunListResponse,
	ValidateResponse,
} from "../response/index.js";

export const executeRoute = describeRoute({
	tags: ["Graphs"],
	summary: "Execute a graph",
	description:
		"Submit a graph for execution. Returns immediately with a run ID.",
	responses: {
		202: {
			description: "Graph execution started",
			content: {
				"application/json": { schema: resolver(ExecuteResponse) },
			},
		},
	},
});

export const validateRoute = describeRoute({
	tags: ["Graphs"],
	summary: "Validate a graph",
	description: "Compile and validate a graph definition without executing it.",
	responses: {
		200: {
			description: "Validation result",
			content: {
				"application/json": { schema: resolver(ValidateResponse) },
			},
		},
	},
});

export const listRunsRoute = describeRoute({
	tags: ["Graphs"],
	summary: "List in-flight runs",
	responses: {
		200: {
			description: "List of currently executing runs",
			content: {
				"application/json": { schema: resolver(RunListResponse) },
			},
		},
	},
});

export const getRunRoute = describeRoute({
	tags: ["Graphs"],
	summary: "Get run status",
	description: "Get detailed status of a single in-flight run.",
	responses: {
		200: {
			description: "Run details",
			content: {
				"application/json": { schema: resolver(RunDetail) },
			},
		},
		404: {
			description: "Run not found",
			content: {
				"application/json": { schema: resolver(ErrorResponse) },
			},
		},
	},
});

export const cancelRunRoute = describeRoute({
	tags: ["Graphs"],
	summary: "Cancel a run",
	description: "Cancel a running graph execution.",
	responses: {
		200: {
			description: "Run cancelled",
			content: {
				"application/json": { schema: resolver(CancelResponse) },
			},
		},
		404: {
			description: "Run not found",
			content: {
				"application/json": { schema: resolver(ErrorResponse) },
			},
		},
	},
});
