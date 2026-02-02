import { getLogger } from "@logtape/logtape";
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
import type { ErrorResponse } from "./response/error.js";

const logger = getLogger(["nvisy", "server"]);

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
			c.req.valid("json");
			// TODO: compile, submit to runtime, return immediately
			const runId = crypto.randomUUID();
			logger.info("Graph execution submitted: {runId}", { runId });
			return c.json({ runId }, 202);
		},
	);

	app.post(
		"/api/v1/graphs/validate",
		validateRoute,
		validator("json", ValidateRequest),
		async (c) => {
			c.req.valid("json");
			// TODO: parse graph JSON, compile DAG, check node references
			//       and connector types, return validation result
			logger.debug("Graph validation requested");
			return c.json({ valid: true, errors: [] });
		},
	);

	app.get("/api/v1/graphs", listRunsRoute, async (c) => {
		logger.debug("Listing runs");
		// TODO: return list of currently executing runs
		return c.json([]);
	});

	app.get(
		"/api/v1/graphs/:runId",
		getRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			logger.debug("Run status requested: {runId}", { runId });
			// TODO: return detailed status for a single in-flight run
			const requestId = c.get("requestId") as string | undefined;
			const body: ErrorResponse = {
				status: 404,
				error: `Run not found: ${runId}`,
				requestId,
			};
			return c.json(body, 404);
		},
	);

	app.delete(
		"/api/v1/graphs/:runId",
		cancelRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			// TODO: interrupt the running execution
			logger.info("Run cancellation requested: {runId}", { runId });
			const requestId = c.get("requestId") as string | undefined;
			const body: ErrorResponse = {
				status: 404,
				error: `Run not found: ${runId}`,
				requestId,
			};
			return c.json(body, 404);
		},
	);

	logger.debug("  POST {route}", { route: "/api/v1/graphs/execute" });
	logger.debug("  POST {route}", { route: "/api/v1/graphs/validate" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs/:runId" });
	logger.debug("  DEL  {route}", { route: "/api/v1/graphs/:runId" });
}
