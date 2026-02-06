/**
 * Typed server configuration loaded from environment variables.
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

import { AsyncLocalStorage } from "node:async_hooks";
import {
	configure,
	getConsoleSink,
	jsonLinesFormatter,
} from "@logtape/logtape";
import { prettyFormatter } from "@logtape/pretty";
import { redactByField } from "@logtape/redaction";
import { z } from "zod";

const EnvSchema = z.object({
	PORT: z.coerce.number().default(8080),
	HOST: z.string().default("0.0.0.0"),
	CORS_ORIGIN: z.string().default("*"),
	BODY_LIMIT_BYTES: z.coerce.number().default(1024 * 1024),
	REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
	NODE_ENV: z.string().default("development"),
});

export interface ServerConfig {
	readonly port: number;
	readonly host: string;
	readonly corsOrigin: string;
	readonly bodyLimitBytes: number;
	readonly requestTimeoutMs: number;
	readonly isDevelopment: boolean;
}

export function loadConfig(): ServerConfig {
	const env = EnvSchema.parse(process.env);

	return {
		port: env.PORT,
		host: env.HOST,
		corsOrigin: env.CORS_ORIGIN,
		bodyLimitBytes: env.BODY_LIMIT_BYTES,
		requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
		isDevelopment: env.NODE_ENV !== "production",
	};
}

/**
 * Configure LogTape logging.
 *
 * - **development** — human-readable, coloured console output via `@logtape/pretty`.
 * - **production** — JSON Lines (machine-parseable) via the built-in `jsonLinesFormatter`.
 *
 * Sensitive fields are automatically redacted by `@logtape/redaction`.
 * Per-request `requestId` is propagated to every log call via
 * `AsyncLocalStorage` — see `middleware/index.ts`.
 */
export async function configureLogging(config: ServerConfig): Promise<void> {
	const consoleSink = config.isDevelopment
		? getConsoleSink({ formatter: prettyFormatter })
		: getConsoleSink({ formatter: jsonLinesFormatter });

	await configure({
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
}
