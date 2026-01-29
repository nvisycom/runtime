/**
 * Error codes for all Nvisy errors.
 * Each code maps to a specific failure domain, enabling
 * programmatic error handling via `error.code`.
 */
export type ErrorCode =
	| "CONNECTION_FAILED"
	| "VALIDATION_FAILED"
	| "PROCESS_FAILED"
	| "LLM_FAILED"
	| "STORAGE_FAILED"
	| "TIMEOUT"
	| "CANCELLED";

export interface ErrorContext {
	/** Which component/subsystem produced the error. */
	readonly source?: string | undefined;
	/** Machine-readable metadata about the failure (ids, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>> | undefined;
	/** Whether this error is safe to retry. */
	readonly retryable?: boolean | undefined;
}

/**
 * Single error class for the entire runtime.
 *
 * Instead of a deep class hierarchy, a flat `code` discriminant plus
 * a structured `context` bag covers every failure mode while staying
 * easy to match on:
 *
 * ```ts
 * if (err.code === "LLM_FAILED" && err.retryable) { … }
 * ```
 */
export class NvisyError extends Error {
	readonly code: ErrorCode;
	readonly context: ErrorContext;
	override readonly cause?: Error | undefined;

	constructor(
		code: ErrorCode,
		message: string,
		context: ErrorContext = {},
		cause?: Error,
	) {
		super(message);
		this.name = "NvisyError";
		this.code = code;
		this.context = context;
		this.cause = cause;
	}

	/** True when the caller may safely retry the operation. */
	get retryable(): boolean {
		return this.context.retryable === true;
	}
}
