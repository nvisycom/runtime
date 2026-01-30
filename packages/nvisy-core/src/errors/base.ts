import { Data } from "effect";

// ── Shared context ──────────────────────────────────────────────────

/** Structured context attached to every Nvisy error. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string | undefined;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>> | undefined;
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean | undefined;
}

// ── Tagged errors ───────────────────────────────────────────────────

/** Could not reach an external service. */
export class ConnectionError extends Data.TaggedError("ConnectionError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** Input did not pass schema / business rules. */
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** A pipeline step failed unexpectedly. */
export class ProcessError extends Data.TaggedError("ProcessError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** An LLM call returned an error. */
export class LlmError extends Data.TaggedError("LlmError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** Read/write to a storage backend failed. */
export class StorageError extends Data.TaggedError("StorageError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** An operation exceeded its deadline. */
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

/** The operation was explicitly cancelled. */
export class CancelledError extends Data.TaggedError("CancelledError")<{
	readonly message: string;
	readonly context: ErrorContext;
	readonly cause?: Error | undefined;
}> {}

// ── Union ───────────────────────────────────────────────────────────

/**
 * Union of all Nvisy error types.
 *
 * Each variant carries a `_tag` literal discriminant for use with
 * `Effect.catchTag` and exhaustive matching.
 */
export type NvisyError =
	| ConnectionError
	| ValidationError
	| ProcessError
	| LlmError
	| StorageError
	| TimeoutError
	| CancelledError;
