/**
 * Server entry point.
 *
 * Reads configuration from environment variables, configures
 * logging via LogTape, builds the Hono app, and starts the
 * HTTP server.
 *
 * @module
 */

import { getLogger } from "@logtape/logtape";
import { createApp, startServer } from "./app.js";
import { configureLogging, loadConfig } from "./config.js";

const config = loadConfig();
await configureLogging(config);

const { app, injectWebSocket } = createApp(config);

const { close } = startServer({
	app,
	host: config.host,
	port: config.port,
	injectWebSocket,
});

const logger = getLogger(["nvisy", "server"]);

function shutdown() {
	logger.info("Shutting down");
	close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
