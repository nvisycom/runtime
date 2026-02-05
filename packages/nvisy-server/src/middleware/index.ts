/**
 * Global middleware registration.
 *
 * Middleware is applied in declaration order. The first three entries
 * establish the per-request foundations that everything else relies on:
 *
 *  1. **OTel instrumentation** — wraps the request in an OpenTelemetry span.
 *  2. **Request ID** — generates (or reads from `X-Request-Id`) a UUID.
 *  3. **Implicit log context** — propagates `requestId` into every LogTape
 *     log call for the remainder of the request via `withContext`.
 *
 * After that, the request logger and standard security / transport
 * middleware are registered.
 */

import { httpInstrumentationMiddleware } from "@hono/otel";
import { withContext } from "@logtape/logtape";
import type { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import type { ServerConfig } from "../config.js";
import { createErrorHandler, createNotFoundHandler } from "./error-handler.js";
import { createRequestLogger } from "./request-logger.js";

export { engineMiddleware, getEngine } from "./engine.js";

/** Register all global middleware on the given Hono app. */
export function registerMiddleware(app: Hono, config: ServerConfig) {
	app.onError(createErrorHandler({ isDevelopment: config.isDevelopment }));
	app.notFound(createNotFoundHandler({ isDevelopment: config.isDevelopment }));

	app.use("*", httpInstrumentationMiddleware());
	app.use("*", requestId());
	app.use("*", async (c, next) => {
		await withContext({ requestId: c.get("requestId") }, next);
	});
	app.use("*", createRequestLogger({ isDevelopment: config.isDevelopment }));

	app.use("*", secureHeaders());
	app.use("*", csrf());
	app.use("*", compress());
	app.use("*", etag());
	app.use("*", bodyLimit({ maxSize: config.bodyLimitBytes }));
	app.use("*", timeout(config.requestTimeoutMs));
	app.use("*", timing());
	app.use("*", cors({ origin: config.corsOrigin }));
}
