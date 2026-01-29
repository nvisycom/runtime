import { NvisyError } from "@nvisy/core";
import type { ErrorHandler } from "hono";

/** Global error handler that maps NvisyError subclasses to HTTP responses. */
export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof NvisyError) {
		const status = mapErrorToStatus(err.code);
		return c.json({ error: err.code, message: err.message }, status);
	}

	console.error("Unhandled error:", err);
	return c.json(
		{ error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
		500,
	);
};

function mapErrorToStatus(
	code: string,
): 400 | 404 | 409 | 422 | 429 | 500 | 503 | 504 {
	switch (code) {
		case "INVALID_DEFINITION":
		case "VALIDATION_ERROR":
			return 422;
		case "CONNECTION_NOT_FOUND":
			return 404;
		case "RATE_LIMIT":
			return 429;
		case "TIMEOUT":
			return 504;
		case "CANCELLED":
			return 409;
		case "TOKEN_LIMIT":
			return 400;
		case "CONNECTION_ERROR":
		case "STORAGE_ERROR":
			return 503;
		default:
			return 500;
	}
}
