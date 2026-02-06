import type { OpenAPIHono } from "@hono/zod-openapi";
import { getLogger } from "@logtape/logtape";
import { healthRoute, readyRoute } from "./health-routes.js";

const logger = getLogger(["nvisy", "server"]);

/**
 * Health and readiness endpoints.
 *
 * GET /health — Liveness probe. Always returns 200.
 * GET /ready  — Readiness probe. Returns 200 when the runtime can accept work.
 */
export function registerHealthHandler(app: OpenAPIHono): void {
	app.openapi(healthRoute, (c) => {
		return c.json({ status: "ok" as const }, 200);
	});

	app.openapi(readyRoute, (c) => {
		// TODO: check whether the runtime can accept new graph executions
		return c.json({ status: "ready" as const }, 200);
	});

	logger.debug("  GET {route}", { route: "/health" });
	logger.debug("  GET {route}", { route: "/ready" });
}
