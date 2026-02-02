/**
 * Global error and not-found handlers.
 *
 * - {@link createErrorHandler}    — registered via `app.onError`
 * - {@link createNotFoundHandler} — registered via `app.notFound`
 *
 * Both return the unified {@link ErrorResponse} JSON envelope so every
 * error response — 4xx, 5xx, thrown `HTTPException`, unmatched route —
 * has the same shape.
 *
 * `requestId` appears in log output automatically via LogTape implicit
 * context (set by the `withContext` middleware in `index.ts`). It is
 * still read from the Hono context for inclusion in the JSON body.
 */

import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { getLogger } from "@logtape/logtape";
import type { ErrorResponse } from "../handler/response/error.js";

const logger = getLogger(["nvisy", "server"]);

/**
 * Create the global `app.onError` handler.
 *
 * - `HTTPException` → logs at warn, returns the exception's status + message.
 * - Anything else   → logs at error, returns 500 with a generic message
 *   (or the real message + stack trace in development).
 */
export function createErrorHandler(opts: { isDevelopment: boolean }): ErrorHandler {
	return (error: Error, c: Context): Response => {
		const requestId = c.get("requestId") as string | undefined;

		if (error instanceof HTTPException) {
			const status = error.status;
			logger.warn("HTTP {status} on {method} {path}: {message}", {
				status,
				method: c.req.method,
				path: c.req.path,
				message: error.message,
			});
			const body: ErrorResponse = { status, error: error.message, requestId };
			return c.json(body, status);
		}

		logger.error("Unhandled error on {method} {path}: {message}", {
			method: c.req.method,
			path: c.req.path,
			message: error.message,
			stack: error.stack,
		});

		const body: ErrorResponse = {
			status: 500,
			error: opts.isDevelopment ? error.message : "Internal server error",
			requestId,
			...(opts.isDevelopment && error.stack ? { stack: error.stack } : {}),
		};
		return c.json(body, 500);
	};
}

/**
 * Create the global `app.notFound` handler.
 *
 * - **development** — includes the method and path in the error message.
 * - **production**  — returns a generic "Not found" message.
 */
export function createNotFoundHandler(opts: { isDevelopment: boolean }): NotFoundHandler {
	return (c) => {
		const requestId = c.get("requestId") as string | undefined;
		const body: ErrorResponse = opts.isDevelopment
			? {
					status: 404,
					error: `Not found: ${c.req.method} ${c.req.path}`,
					requestId,
				}
			: { status: 404, error: "Not found", requestId };
		return c.json(body, 404);
	};
}
