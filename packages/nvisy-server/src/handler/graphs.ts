import { getLogger } from "@logtape/logtape";
import type { Hono } from "hono";
import { validator } from "hono-openapi";
import { getEngine } from "../middleware/index.js";
import {
	cancelRunRoute,
	executeRoute,
	getRunRoute,
	listRunsRoute,
	validateRoute,
} from "./description/index.js";
import {
	ExecuteRequest,
	RunIdParam,
	ValidateRequest,
} from "./request/index.js";
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
			const { graph, connections } = c.req.valid("json");
			const engine = getEngine(c);

			const runId = engine.execute(graph, connections);
			logger.info("Graph execution submitted: {runId}", { runId });

			return c.json({ runId }, 202);
		},
	);

	app.post(
		"/api/v1/graphs/validate",
		validateRoute,
		validator("json", ValidateRequest),
		async (c) => {
			const { graph, connections } = c.req.valid("json");
			const engine = getEngine(c);

			logger.debug("Graph validation requested");
			const result = engine.validate(graph, connections);

			return c.json(result);
		},
	);

	app.get("/api/v1/graphs", listRunsRoute, async (c) => {
		const engine = getEngine(c);

		logger.debug("Listing runs");
		const runs = engine.listRuns();

		return c.json(runs);
	});

	app.get(
		"/api/v1/graphs/:runId",
		getRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			const engine = getEngine(c);

			logger.debug("Run status requested: {runId}", { runId });
			const run = engine.getRun(runId);

			if (!run) {
				const requestId = c.get("requestId") as string | undefined;
				const body: ErrorResponse = {
					status: 404,
					error: `Run not found: ${runId}`,
					requestId,
				};
				return c.json(body, 404);
			}

			return c.json({
				runId: run.runId,
				status: run.status,
				startedAt: run.startedAt.toISOString(),
				completedAt: run.completedAt?.toISOString(),
				nodeProgress: Object.fromEntries(run.nodeProgress),
				result: run.result,
				error: run.error?.message,
			});
		},
	);

	app.delete(
		"/api/v1/graphs/:runId",
		cancelRunRoute,
		validator("param", RunIdParam),
		async (c) => {
			const { runId } = c.req.valid("param");
			const engine = getEngine(c);

			logger.info("Run cancellation requested: {runId}", { runId });
			const cancelled = engine.cancelRun(runId);

			if (!cancelled) {
				const requestId = c.get("requestId") as string | undefined;
				const body: ErrorResponse = {
					status: 404,
					error: `Run not found or already completed: ${runId}`,
					requestId,
				};
				return c.json(body, 404);
			}

			return c.json({ runId, cancelled: true });
		},
	);

	logger.debug("  POST {route}", { route: "/api/v1/graphs/execute" });
	logger.debug("  POST {route}", { route: "/api/v1/graphs/validate" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs/:runId" });
	logger.debug("  DEL  {route}", { route: "/api/v1/graphs/:runId" });
}
