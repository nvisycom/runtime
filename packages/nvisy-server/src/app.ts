/**
 * Application building blocks for the Nvisy HTTP server.
 *
 * Exports the Hono app factory ({@link createApp}) and a plain
 * server lifecycle ({@link startServer}). These are composed
 * into a running service by `main.ts`.
 *
 * @module
 */

import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";
import type { ServerConfig } from "./config.js";
import { registerMiddleware } from "./middleware/index.js";
import { registerHandlers } from "./handler/index.js";

const logger = getLogger(["nvisy", "server"]);

/** Build a fully configured Hono application with middleware and routes. */
export function createApp(config: ServerConfig) {
	const app = new Hono();
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

	logger.debug("Registering middleware");
	registerMiddleware(app, config);
	logger.debug("Registering route handlers");
	registerHandlers(app, config);
	logger.debug("App initialised (mode={mode}, cors={cors})", {
		mode: config.isDevelopment ? "development" : "production",
		cors: config.corsOrigin,
	});

	return { app, injectWebSocket, upgradeWebSocket };
}

export interface StartServerOptions {
	app: Hono;
	host: string;
	port: number;
	injectWebSocket: (server: ReturnType<typeof serve>) => void;
}

/**
 * Start the Node.js HTTP server.
 *
 * Returns a cleanup function that closes the server gracefully.
 */
export function startServer(opts: StartServerOptions): {
	server: ReturnType<typeof serve>;
	close: () => void;
} {
	const server = serve({
		fetch: opts.app.fetch,
		hostname: opts.host,
		port: opts.port,
	});
	opts.injectWebSocket(server);

	logger.info("Server started on {host}:{port}", {
		host: opts.host,
		port: opts.port,
	});

	return {
		server,
		close: () => server.close(),
	};
}
