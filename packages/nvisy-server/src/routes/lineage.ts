import { Hono } from "hono";

/**
 * Lineage query endpoints.
 *
 * GET /api/lineage/:primitiveId — Trace the full lineage of a primitive
 *                                  (forward and backward through the graph)
 */
export function lineageRoutes(): Hono {
	const app = new Hono();

	app.get("/lineage/:primitiveId", async (c) => {
		const { primitiveId } = c.req.param();
		// TODO: query lineage store
		return c.json({ error: "not found", primitiveId }, 404);
	});

	return app;
}
