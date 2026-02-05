import type { OpenAPIHono } from "@hono/zod-openapi";
import { getLogger } from "@logtape/logtape";
import { getEngine } from "../middleware/index.js";
import {
	cancelRunRoute,
	executeRoute,
	getRunRoute,
	listRunsRoute,
	validateRoute,
} from "./graphs-routes.js";

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
export function registerGraphHandler(app: OpenAPIHono): void {
	app.openapi(executeRoute, async (c) => {
		const { graph, connections } = c.req.valid("json");
		const engine = getEngine(c);

		const runId = engine.execute(graph, connections);
		logger.info("Graph execution submitted: {runId}", { runId });

		return c.json({ runId }, 202);
	});

	app.openapi(validateRoute, async (c) => {
		const { graph, connections } = c.req.valid("json");
		const engine = getEngine(c);

		logger.debug("Graph validation requested");
		const result = engine.validate(graph, connections);

		return c.json({ valid: result.valid, errors: [...result.errors] }, 200);
	});

	app.openapi(listRunsRoute, async (c) => {
		const engine = getEngine(c);

		logger.debug("Listing runs");
		const runs = engine.listRuns();

		return c.json(
			runs.map((run) => ({
				runId: run.runId,
				status: run.status,
				startedAt: run.startedAt.toISOString(),
				completedAt: run.completedAt?.toISOString(),
			})),
			200,
		);
	});

	app.openapi(getRunRoute, async (c) => {
		const { runId } = c.req.valid("param");
		const engine = getEngine(c);

		logger.debug("Run status requested: {runId}", { runId });
		const run = engine.getRun(runId);

		if (!run) {
			const requestId = c.get("requestId") as string | undefined;
			return c.json(
				{ status: 404, error: `Run not found: ${runId}`, requestId },
				404,
			);
		}

		const nodeProgress: Record<
			string,
			{
				nodeId: string;
				status: "pending" | "running" | "completed" | "failed";
				itemsProcessed: number;
				error?: string;
			}
		> = {};
		for (const [nodeId, progress] of run.nodeProgress) {
			nodeProgress[nodeId] = {
				nodeId: progress.nodeId,
				status: progress.status,
				itemsProcessed: progress.itemsProcessed,
				...(progress.error && { error: progress.error.message }),
			};
		}

		return c.json(
			{
				runId: run.runId,
				status: run.status,
				startedAt: run.startedAt.toISOString(),
				completedAt: run.completedAt?.toISOString(),
				nodeProgress,
				result: run.result
					? {
							runId: run.result.runId,
							status: run.result.status,
							nodes: run.result.nodes.map((n) => ({
								nodeId: n.nodeId,
								status: n.status,
								itemsProcessed: n.itemsProcessed,
								...(n.error && { error: n.error.message }),
							})),
						}
					: undefined,
				error: run.error?.message,
			},
			200,
		);
	});

	app.openapi(cancelRunRoute, async (c) => {
		const { runId } = c.req.valid("param");
		const engine = getEngine(c);

		logger.info("Run cancellation requested: {runId}", { runId });
		const cancelled = engine.cancelRun(runId);

		if (!cancelled) {
			const requestId = c.get("requestId") as string | undefined;
			return c.json(
				{
					status: 404,
					error: `Run not found or already completed: ${runId}`,
					requestId,
				},
				404,
			);
		}

		return c.json({ runId, cancelled: true }, 200);
	});

	logger.debug("  POST {route}", { route: "/api/v1/graphs/execute" });
	logger.debug("  POST {route}", { route: "/api/v1/graphs/validate" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs" });
	logger.debug("  GET  {route}", { route: "/api/v1/graphs/:runId" });
	logger.debug("  DEL  {route}", { route: "/api/v1/graphs/:runId" });
}
