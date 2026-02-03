import { getLogger } from "@logtape/logtape";
import type { Hono } from "hono";
import { healthRoute, readyRoute } from "./description/index.js";

const logger = getLogger(["nvisy", "server"]);

/**
 * Health and readiness endpoints.
 *
 * GET /health — Liveness probe. Always returns 200.
 * GET /ready  — Readiness probe. Returns 200 when the runtime can accept work.
 */
export function registerHealthHandler(app: Hono): void {
	app.get("/health", healthRoute, (c) => c.json({ status: "ok" as const }));
	app.get("/ready", readyRoute, (c) => {
		// TODO: check whether the runtime can accept new graph executions
		return c.json({ status: "ready" as const });
	});
	logger.debug("  GET {route}", { route: "/health" });
	logger.debug("  GET {route}", { route: "/ready" });
}
