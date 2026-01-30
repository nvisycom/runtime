import { Hono } from "hono";

/**
 * Connector introspection endpoints.
 *
 * GET  /api/connectors              — List all registered connectors
 * GET  /api/connectors/:name        — Get connector details and capabilities
 * GET  /api/connectors/:name/health — Health check a specific connector
 */
export function connectorRoutes(): Hono {
	const app = new Hono();

	app.get("/connectors", async (c) => {
		// TODO: read from connector registry
		return c.json([]);
	});

	app.get("/connectors/:name", async (c) => {
		const { name } = c.req.param();
		// TODO: fetch connector metadata
		return c.json({ error: "not found", name }, 404);
	});

	app.get("/connectors/:name/health", async (c) => {
		const { name } = c.req.param();
		// TODO: invoke connector health check
		return c.json({ error: "not implemented", name }, 501);
	});

	return app;
}
