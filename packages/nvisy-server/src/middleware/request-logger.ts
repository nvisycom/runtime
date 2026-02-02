/**
 * HTTP request logger backed by {@link https://jsr.io/@logtape/hono | @logtape/hono}.
 *
 * - **development** — human-readable one-liner:
 *   `GET /api/v1/graphs → 200 (1.2ms)`
 * - **production** — structured object (consumed by `jsonLinesFormatter`):
 *   `{ method, path, status, responseTime }`
 *
 * The per-request `requestId` is attached automatically via LogTape
 * implicit context — see the `withContext` middleware in `index.ts`.
 */

import type { MiddlewareHandler } from "hono";
import { honoLogger, type HonoContext } from "@logtape/hono";

/** Human-readable request summary for development console output. */
const devFormat = (c: HonoContext, ms: number): string =>
	`${c.req.method} ${c.req.path} → ${c.res.status} (${ms.toFixed(1)}ms)`;

/** Structured request properties for JSON Lines production output. */
const prodFormat = (c: HonoContext, ms: number) => ({
	method: c.req.method,
	path: c.req.path,
	status: c.res.status,
	responseTime: ms.toFixed(1),
});

/** Create request-logging middleware appropriate for the environment. */
export function createRequestLogger(opts: {
	isDevelopment: boolean;
}): MiddlewareHandler {
	return honoLogger({
		category: ["nvisy", "server"],
		format: opts.isDevelopment ? devFormat : prodFormat,
	});
}
