import { Hono } from "hono";

/**
 * Graph lifecycle endpoints.
 *
 * POST   /api/graphs           — Create a new graph definition
 * GET    /api/graphs           — List all graphs
 * GET    /api/graphs/:id       — Get a graph by ID
 * PUT    /api/graphs/:id       — Replace a graph definition
 * DELETE /api/graphs/:id       — Delete a graph
 * POST   /api/graphs/validate  — Validate a graph definition without persisting
 */
export function graphRoutes(): Hono {
	const app = new Hono();

	app.post("/graphs", async (c) => {
		// TODO: parse body, validate JSON schema, persist
		return c.json({ error: "not implemented" }, 501);
	});

	app.get("/graphs", async (c) => {
		// TODO: list from storage
		return c.json([]);
	});

	app.get("/graphs/:id", async (c) => {
		const { id } = c.req.param();
		// TODO: fetch from storage
		return c.json({ error: "not found", id }, 404);
	});

	app.put("/graphs/:id", async (c) => {
		const { id } = c.req.param();
		// TODO: validate and replace
		return c.json({ error: "not implemented", id }, 501);
	});

	app.delete("/graphs/:id", async (c) => {
		const { id } = c.req.param();
		// TODO: delete from storage
		return c.json({ error: "not implemented", id }, 501);
	});

	app.post("/graphs/validate", async (c) => {
		// TODO: parse and validate without persisting
		return c.json({ valid: false, errors: ["not implemented"] }, 501);
	});

	return app;
}
