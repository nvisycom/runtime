/**
 * Error codes for all Nvisy errors.
 *
 * Each code maps to a specific failure domain, enabling programmatic
 * error handling via {@link NvisyError.code}:
 *
 * | Code                 | Meaning                                    |
 * |----------------------|--------------------------------------------|
 * | `CONNECTION_FAILED`  | Could not reach an external service         |
 * | `VALIDATION_FAILED`  | Input did not pass schema / business rules  |
 * | `PROCESS_FAILED`     | A pipeline step failed unexpectedly         |
 * | `LLM_FAILED`         | An LLM call returned an error               |
 * | `STORAGE_FAILED`     | Read/write to a storage backend failed      |
 * | `TIMEOUT`            | An operation exceeded its deadline           |
 * | `CANCELLED`          | The operation was explicitly cancelled       |
 */
export type ErrorCode =
	| "CONNECTION_FAILED"
	| "VALIDATION_FAILED"
	| "PROCESS_FAILED"
	| "LLM_FAILED"
	| "STORAGE_FAILED"
	| "TIMEOUT"
	| "CANCELLED";

/** Structured context attached to every {@link NvisyError}. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string | undefined;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>> | undefined;
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean | undefined;
}

/**
 * Single error class for the entire Nvisy runtime.
 *
 * Uses a flat `code` discriminant plus a structured {@link context} bag
 * instead of a deep class hierarchy, keeping error handling simple:
 *
 * @example
 * ```ts
 * try {
 *   await runPipeline(input);
 * } catch (err) {
 *   if (err instanceof NvisyError && err.code === "LLM_FAILED" && err.retryable) {
 *     // safe to retry
 *   }
 * }
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

	/** `true` when the caller may safely retry the operation. */
	get retryable(): boolean {
		return this.context.retryable === true;
	}
}
