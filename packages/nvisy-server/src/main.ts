/**
 * Server entry point.
 *
 * Composes the {@link HttpServer} Effect Service from the building
 * blocks in `app.ts`, selects a logger based on `NODE_ENV`, and
 * forks the program.
 *
 * - **development** — `Logger.pretty` (human-readable, coloured)
 * - **production**  — `Logger.structured` (JSON, machine-parseable)
 *
 * All log output carries the `nvisy-server` span for easy filtering.
 *
 * @module
 */

import { Config, Effect, Layer, Logger } from "effect";
import { ServerConfig } from "./config.js";
import { createApp, startServer } from "./app.js";

/**
 * Root Effect Service that owns the HTTP server lifecycle.
 *
 * On startup it reads {@link ServerConfig} from the environment,
 * captures the current Effect runtime (so Hono middleware can emit
 * logs through the configured logger), builds the Hono app, and
 * binds the server. The scoped lifecycle guarantees the server is
 * shut down cleanly when the fiber is interrupted.
 */
class HttpServer extends Effect.Service<HttpServer>()(
	"@nvisy/HttpServer",
	{
		scoped: Effect.gen(function* () {
			const config = yield* ServerConfig;
			const runtime = yield* Effect.runtime<never>();

			yield* Effect.logInfo("Configuration loaded").pipe(
				Effect.annotateLogs({
					port: config.port,
					host: config.host,
					corsOrigin: config.corsOrigin,
					isDevelopment: config.isDevelopment,
				}),
			);

			const { app, injectWebSocket } = createApp(config, runtime);
			yield* startServer({
				app,
				host: config.host,
				port: config.port,
				injectWebSocket,
			});

			return {};
		}),
	},
) {}

/**
 * Select a logger layer based on the runtime environment.
 *
 * Returns `Logger.pretty` in development (coloured, human-readable)
 * and `Logger.structured` otherwise (JSON lines, machine-parseable).
 */
function loggerLayer(isDevelopment: boolean): Layer.Layer<never> {
	if (isDevelopment) {
		return Logger.pretty;
	}
	return Logger.structured;
}

const isDevelopment = Effect.runSync(
	Config.string("NODE_ENV").pipe(
		Config.withDefault("development"),
		Config.map((env) => env !== "production"),
	),
);

const program = Layer.launch(Layer.mergeAll(HttpServer.Default)).pipe(
	Effect.withLogSpan("nvisy-server"),
	Effect.provide(loggerLayer(isDevelopment)),
);

Effect.runFork(program);
