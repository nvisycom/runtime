import { Hono } from "hono";
import { Schema as S } from "effect";
import { effectValidator } from "@hono/effect-validator";
import { describeRoute, resolver } from "hono-openapi";

const ExecuteRequest = S.Struct({
	graph: S.Record({ key: S.String, value: S.Unknown }),
	config: S.optional(S.Record({ key: S.String, value: S.Unknown })),
});

const ExecuteResponse = S.standardSchemaV1(
	S.Struct({ runId: S.String }),
);

const ValidateRequest = S.Struct({
	graph: S.Record({ key: S.String, value: S.Unknown }),
});

const ValidateResponse = S.standardSchemaV1(
	S.Struct({
		valid: S.Boolean,
		errors: S.Array(S.String),
	}),
);

const RunStatusSchema = S.Struct({
	runId: S.String,
	status: S.Literal(
		"running",
		"success",
		"partial_failure",
		"failure",
		"cancelled",
	),
	startedAt: S.String,
	nodesCompleted: S.Number,
	nodesTotal: S.Number,
});

const RunStatus = S.standardSchemaV1(RunStatusSchema);

const RunDetail = S.standardSchemaV1(
	S.Struct({
		runId: S.String,
		status: S.Literal(
			"running",
			"success",
			"partial_failure",
			"failure",
			"cancelled",
		),
		startedAt: S.String,
		nodes: S.Array(
			S.Struct({
				id: S.String,
				status: S.Literal("pending", "running", "success", "failure", "skipped"),
			}),
		),
	}),
);

const RunListResponse = S.standardSchemaV1(S.Array(RunStatusSchema));

const ErrorResponse = S.standardSchemaV1(
	S.Struct({ error: S.String, runId: S.String }),
);

const CancelResponse = S.standardSchemaV1(
	S.Struct({ cancelled: S.Boolean, runId: S.String }),
);

const RunIdParam = S.Struct({ runId: S.String });

const executeRoute = describeRoute({
	tags: ["Graphs"],
	summary: "Execute a graph",
	description: "Submit a graph for execution. Returns immediately with a run ID.",
	responses: {
		202: {
			description: "Graph execution started",
			content: {
				"application/json": { schema: resolver(ExecuteResponse) },
			},
		},
	},
});

const validateRoute = describeRoute({
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

const listRunsRoute = describeRoute({
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

const getRunRoute = describeRoute({
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

const cancelRunRoute = describeRoute({
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

/**
 * Graph execution endpoints.
 *
 * POST   /api/v1/graphs/execute    — Submit a graph for execution, returns { runId }
 * POST   /api/v1/graphs/validate   — Compile and validate a graph without executing
 * GET    /api/v1/graphs            — List in-flight runs
 * GET    /api/v1/graphs/:runId     — Get detailed status of a single in-flight run
 * DELETE /api/v1/graphs/:runId     — Cancel a running execution
 */
export function graphRoutes(): Hono {
	const app = new Hono();

	app.post(
		"/graphs/execute",
		executeRoute,
		effectValidator("json", ExecuteRequest),
		async (c) => {
			const _body = c.req.valid("json");
			// TODO: compile, submit to runtime, return immediately
			const runId = crypto.randomUUID();
			return c.json({ runId }, 202);
		},
	);

	app.post(
		"/graphs/validate",
		validateRoute,
		effectValidator("json", ValidateRequest),
		async (c) => {
			const _body = c.req.valid("json");
			// TODO: parse graph JSON, compile DAG, check node references
			//       and connector types, return validation result
			return c.json({ valid: true, errors: [] });
		},
	);

	app.get("/graphs", listRunsRoute, async (c) => {
		// TODO: return list of currently executing runs
		return c.json([]);
	});

	app.get(
		"/graphs/:runId",
		getRunRoute,
		effectValidator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			// TODO: return detailed status for a single in-flight run
			return c.json({ error: "not found", runId }, 404);
		},
	);

	app.delete(
		"/graphs/:runId",
		cancelRunRoute,
		effectValidator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			// TODO: interrupt the Effect fiber for this run
			return c.json({ error: "not found", runId }, 404);
		},
	);

	return app;
}
