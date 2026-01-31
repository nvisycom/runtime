/**
 * Typed server configuration loaded from environment variables via
 * Effect's {@link Config} module.
 *
 * | Variable             | Type   | Default         |
 * |----------------------|--------|-----------------|
 * | `PORT`               | number | `8080`          |
 * | `HOST`               | string | `"0.0.0.0"`     |
 * | `CORS_ORIGIN`        | string | `"*"`           |
 * | `BODY_LIMIT_BYTES`   | number | `1048576` (1MB) |
 * | `REQUEST_TIMEOUT_MS` | number | `30000` (30s)   |
 * | `NODE_ENV`           | string | `"development"` |
 *
 * `isDevelopment` is derived from `NODE_ENV` — `true` unless
 * `NODE_ENV` is explicitly set to `"production"`.
 */

import { Config } from "effect";

export const ServerConfig = Config.all({
	port: Config.number("PORT").pipe(Config.withDefault(8080)),
	host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
	corsOrigin: Config.string("CORS_ORIGIN").pipe(Config.withDefault("*")),
	bodyLimitBytes: Config.number("BODY_LIMIT_BYTES").pipe(
		Config.withDefault(1024 * 1024),
	),
	requestTimeoutMs: Config.number("REQUEST_TIMEOUT_MS").pipe(
		Config.withDefault(30_000),
	),
	isDevelopment: Config.string("NODE_ENV").pipe(
		Config.withDefault("development"),
		Config.map((env) => env !== "production"),
	),
});

export type ServerConfig = Config.Config.Success<typeof ServerConfig>;
