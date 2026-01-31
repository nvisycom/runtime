import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { apiReference } from "@scalar/hono-api-reference";

const SPEC_PATH = "/openapi.json";
const DOCS_PATH = "/docs";

const docsRoute = apiReference({
	spec: { url: SPEC_PATH },
	theme: "default",
});

/**
 * OpenAPI spec and Scalar API reference endpoints.
 *
 * GET /openapi.json — OpenAPI 3.1 JSON spec
 * GET /docs         — Scalar API reference UI
 *
 * @param app - The root Hono app instance (needed to introspect routes).
 */
export function openApiRoutes(app: Hono): Hono {
	const routes = new Hono();

	const specRoute = openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Nvisy Runtime",
				version: "0.1.0",
				description:
					"Stateless execution worker for Nvisy graph pipelines.",
				license: { name: "Apache-2.0" },
			},
			servers: [{ url: "http://localhost:8080" }],
		},
	});

	routes.get(SPEC_PATH, specRoute);
	routes.get(DOCS_PATH, docsRoute);

	return routes;
}
