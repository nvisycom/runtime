import type { Hono } from "hono";
import type { Runtime } from "effect";
import type { ServerConfig } from "../config.js";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { httpInstrumentationMiddleware } from "@hono/otel";
import { requestLogger } from "./logger.js";

/** Register all global middleware on the given Hono app. */
export function registerMiddleware(
	app: Hono,
	config: ServerConfig,
	runtime: Runtime.Runtime<never>,
) {
	app.use("*", httpInstrumentationMiddleware());
	app.use("*", requestId());
	app.use("*", requestLogger(runtime));
	app.use("*", secureHeaders());
	app.use("*", csrf());
	app.use("*", compress());
	app.use("*", etag());
	app.use("*", bodyLimit({ maxSize: config.bodyLimitBytes }));
	app.use("*", timeout(config.requestTimeoutMs));
	app.use("*", timing());
	app.use("*", cors({ origin: config.corsOrigin }));
}
