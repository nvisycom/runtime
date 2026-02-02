/**
 * Server entry point.
 *
 * Reads configuration from environment variables, configures
 * logging via LogTape, builds the Hono app, and starts the
 * HTTP server.
 *
 * ## Logging
 *
 * - **development** — human-readable, coloured console output
 *   via `@logtape/pretty`.
 * - **production** — JSON Lines (machine-parseable) via the
 *   built-in `jsonLinesFormatter`.
 *
 * Sensitive fields are automatically redacted by `@logtape/redaction`.
 * Per-request `requestId` is propagated to every log call via
 * `AsyncLocalStorage` — see `middleware/index.ts`.
 *
 * @module
 */

import { AsyncLocalStorage } from "node:async_hooks";
import {
	configure,
	getConsoleSink,
	getLogger,
	jsonLinesFormatter,
} from "@logtape/logtape";
import { prettyFormatter } from "@logtape/pretty";
import { redactByField } from "@logtape/redaction";
import { loadConfig } from "./config.js";
import { createApp, startServer } from "./app.js";

const config = loadConfig();

// Development  → coloured, human-readable lines (@logtape/pretty)
// Production   → one JSON object per line (jsonLinesFormatter)
const consoleSink = config.isDevelopment
	? getConsoleSink({ formatter: prettyFormatter })
	: getConsoleSink({ formatter: jsonLinesFormatter });

await configure({
	// Enables LogTape implicit contexts so that `withContext({ requestId })`
	// in middleware automatically attaches the request ID to every log record.
	contextLocalStorage: new AsyncLocalStorage(),
	sinks: { console: redactByField(consoleSink) },
	loggers: [
		{
			category: ["logtape", "meta"],
			lowestLevel: "warning",
			sinks: ["console"],
		},
		{
			category: ["nvisy"],
			lowestLevel: config.isDevelopment ? "debug" : "info",
			sinks: ["console"],
		},
	],
});

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
