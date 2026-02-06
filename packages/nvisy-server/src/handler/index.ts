import type { OpenAPIHono } from "@hono/zod-openapi";
import { getLogger } from "@logtape/logtape";
import type { ServerConfig } from "../config.js";
import { registerGraphHandler } from "./graphs.js";
import { registerHealthHandler } from "./health.js";
import { registerOpenApiHandler } from "./openapi.js";

const logger = getLogger(["nvisy", "server"]);

/**
 * Register all route handlers on the given OpenAPIHono app.
 *
 * Registration order matters: health and graph handlers are registered
 * first so that the OpenAPI spec includes all routes.
 */
export function registerHandlers(app: OpenAPIHono, config: ServerConfig): void {
	logger.debug("Registering health handlers");
	registerHealthHandler(app);
	logger.debug("Registering graph handlers");
	registerGraphHandler(app);
	logger.debug("Registering OpenAPI handlers");
	registerOpenApiHandler(app, config);
}
