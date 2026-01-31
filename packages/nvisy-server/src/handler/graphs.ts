import type { Hono } from "hono";
import { validator } from "hono-openapi";
import { ExecuteRequest, ValidateRequest, RunIdParam } from "./request/index.js";
import {
	executeRoute,
	validateRoute,
	listRunsRoute,
	getRunRoute,
	cancelRunRoute,
} from "./description/index.js";

/**
 * Graph execution endpoints.
 *
 * POST   /api/v1/graphs/execute    — Submit a graph for execution, returns { runId }
 * POST   /api/v1/graphs/validate   — Compile and validate a graph without executing
 * GET    /api/v1/graphs            — List in-flight runs
 * GET    /api/v1/graphs/:runId     — Get detailed status of a single in-flight run
 * DELETE /api/v1/graphs/:runId     — Cancel a running execution
 */
export function registerGraphHandler(app: Hono): void {
	app.post(
		"/api/v1/graphs/execute",
		executeRoute,
		validator("json", ExecuteRequest),
		async (c) => {
			const _body = c.req.valid("json");
			// TODO: compile, submit to runtime, return immediately
			const runId = crypto.randomUUID();
			return c.json({ runId }, 202);
		},
	);

	app.post(
		"/api/v1/graphs/validate",
		validateRoute,
		validator("json", ValidateRequest),
		async (c) => {
			const _body = c.req.valid("json");
			// TODO: parse graph JSON, compile DAG, check node references
			//       and connector types, return validation result
			return c.json({ valid: true, errors: [] });
		},
	);

	app.get("/api/v1/graphs", listRunsRoute, async (c) => {
		// TODO: return list of currently executing runs
		return c.json([]);
	});

	app.get(
		"/api/v1/graphs/:runId",
		getRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			// TODO: return detailed status for a single in-flight run
			return c.json({ error: "not found", runId }, 404);
		},
	);

	app.delete(
		"/api/v1/graphs/:runId",
		cancelRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			// TODO: interrupt the Effect fiber for this run
			return c.json({ error: "not found", runId }, 404);
		},
	);
}
