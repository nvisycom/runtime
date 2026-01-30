import { Hono } from "hono";

/**
 * Run management endpoints.
 *
 * POST   /api/graphs/:graphId/runs  — Trigger a new run for a graph
 * GET    /api/graphs/:graphId/runs  — List runs for a graph
 * GET    /api/runs/:id              — Get run status and details
 * POST   /api/runs/:id/cancel       — Cancel a running execution
 */
export function runRoutes(): Hono {
	const app = new Hono();

	app.post("/graphs/:graphId/runs", async (c) => {
		const { graphId } = c.req.param();
		// TODO: compile graph, submit to runtime
		return c.json({ error: "not implemented", graphId }, 501);
	});

	app.get("/graphs/:graphId/runs", async (c) => {
		const { graphId } = c.req.param();
		// TODO: list runs from storage
		return c.json({ graphId, runs: [] });
	});

	app.get("/runs/:id", async (c) => {
		const { id } = c.req.param();
		// TODO: fetch run status
		return c.json({ error: "not found", id }, 404);
	});

	app.post("/runs/:id/cancel", async (c) => {
		const { id } = c.req.param();
		// TODO: interrupt the running Effect fiber
		return c.json({ error: "not implemented", id }, 501);
	});

	return app;
}
