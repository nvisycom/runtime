/**
 * Application building blocks for the Nvisy HTTP server.
 *
 * Exports the Hono app factory ({@link createApp}) and an
 * Effect-managed server lifecycle ({@link startServer}). These
 * are composed into a running service by `main.ts`.
 *
 * @module
 */

import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { Effect, type Runtime } from "effect";
import type { ServerConfig } from "./config.js";
import { registerMiddleware } from "./middleware/index.js";
import { registerHandlers } from "./handler/index.js";

/** Build a fully configured Hono application with middleware and routes. */
export function createApp(config: ServerConfig, runtime: Runtime.Runtime<never>) {
	const app = new Hono();
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

	registerMiddleware(app, config, runtime);
	registerHandlers(app, config);

	return { app, injectWebSocket, upgradeWebSocket };
}

export interface StartServerOptions {
	app: Hono;
	host: string;
	port: number;
	injectWebSocket: (server: ReturnType<typeof serve>) => void;
}

/**
 * Start the Node.js HTTP server with Effect-managed lifecycle.
 *
 * Uses `Effect.acquireRelease` to guarantee the server is closed on
 * fiber interruption or program shutdown. Injects WebSocket support
 * into the running server after binding.
 */
export function startServer(opts: StartServerOptions) {
	return Effect.gen(function* () {
		const server = yield* Effect.acquireRelease(
			Effect.sync(() => {
				const s = serve({
					fetch: opts.app.fetch,
					hostname: opts.host,
					port: opts.port,
				});
				opts.injectWebSocket(s);
				return s;
			}),
			(server) => Effect.sync(() => server.close()),
		);

		yield* Effect.logInfo(`Server started on ${opts.host}:${opts.port}`);

		return server;
	});
}
