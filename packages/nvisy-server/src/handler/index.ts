import { getLogger } from "@logtape/logtape";
import type { Hono } from "hono";
import type { ServerConfig } from "../config.js";
import { registerGraphHandler } from "./graphs.js";
import { registerHealthHandler } from "./health.js";
import { registerOpenApiHandler } from "./openapi.js";

const logger = getLogger(["nvisy", "server"]);

/**
 * Register all route handlers on the given Hono app.
 *
 * Registration order matters: health and graph handlers are registered
 * first so that `registerOpenApiHandler` can introspect the already-
 * registered routes when building the OpenAPI spec.
 */
export function registerHandlers(app: Hono, config: ServerConfig): void {
	logger.debug("Registering health handlers");
	registerHealthHandler(app);
	logger.debug("Registering graph handlers");
	registerGraphHandler(app);
	logger.debug("Registering OpenAPI handlers");
	registerOpenApiHandler(app, config);
}
