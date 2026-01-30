import { Hono } from "hono";

/**
 * Health and readiness endpoints.
 *
 * GET /health   — Liveness probe. Always returns 200.
 * GET /ready    — Readiness probe. Returns 200 when the server can accept work.
 */
export function healthRoutes(): Hono {
	const app = new Hono();

	app.get("/health", (c) => c.json({ status: "ok" }));

	app.get("/ready", (c) => {
		// TODO: check runtime and storage readiness
		return c.json({ status: "ready" });
	});

	return app;
}
