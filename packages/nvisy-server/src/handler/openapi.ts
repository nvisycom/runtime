import { getLogger } from "@logtape/logtape";
import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import type { ServerConfig } from "../config.js";

const logger = getLogger(["nvisy", "server"]);

/** Path where the OpenAPI 3.1 JSON specification is served. */
const SPEC_PATH = "/openapi.json";

/** Path where the Scalar API reference UI is served. */
const DOCS_PATH = "/docs";

/**
 * OpenAPI spec and Scalar API reference endpoints.
 *
 * GET /openapi.json — OpenAPI 3.1 JSON spec
 * GET /docs         — Scalar API reference UI
 *
 * @param app    - The root Hono app instance (needed to introspect routes).
 * @param config - Server configuration used to populate the `servers` field.
 */
export function registerOpenApiHandler(app: Hono, config: ServerConfig): void {
	const specRoute = openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Nvisy Runtime",
				version: "0.1.0",
				description: "Stateless execution worker for Nvisy graph pipelines.",
				license: { name: "Apache-2.0" },
			},
			servers: [{ url: `http://${config.host}:${config.port}` }],
		},
	});

	const docsRoute = Scalar({
		url: SPEC_PATH,
		theme: "default",
	});

	app.get(SPEC_PATH, specRoute);
	app.get(DOCS_PATH, docsRoute);
	logger.debug("  GET {spec}", { spec: SPEC_PATH });
	logger.debug("  GET {docs}", { docs: DOCS_PATH });
}
