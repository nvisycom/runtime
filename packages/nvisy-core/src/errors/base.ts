// ── Error code ──────────────────────────────────────────────────────

/** Discriminant for all Nvisy error types. */
export type ErrorCode =
	| "CONNECTION_ERROR"
	| "VALIDATION_ERROR"
	| "PROCESS_ERROR"
	| "CANCELLED_ERROR";

// ── Shared context ──────────────────────────────────────────────────

/** Structured context attached to every Nvisy error. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>>;
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean;
}

// ── Base class ──────────────────────────────────────────────────────

/**
 * Abstract base class for all Nvisy errors.
 *
 * Every error carries a {@link code} discriminant for `switch` matching
 * and a structured {@link context} for logging / debugging.
 *
 * Extends the built-in `Error` so `instanceof NvisyError` works
 * everywhere — no framework dependency required.
 */
export abstract class NvisyError extends Error {
	/** Discriminant code for switch-based matching. */
	abstract readonly code: ErrorCode;

	/** Structured context about the failure. */
	readonly context: ErrorContext;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, cause ? { cause } : undefined);
		this.name = this.constructor.name;
		this.context = context ?? {};
	}
}

// ── Concrete errors ─────────────────────────────────────────────────

/**
 * Could not reach an external service, storage backend, or database.
 *
 * Also covers missing/unregistered connections.
 */
export class ConnectionError extends NvisyError {
	readonly code = "CONNECTION_ERROR" as const;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}

/**
 * Input did not pass schema or business rules.
 *
 * Also covers invalid workflow/pipeline definitions.
 */
export class ValidationError extends NvisyError {
	readonly code = "VALIDATION_ERROR" as const;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}

/**
 * A pipeline step, LLM call, or operation failed unexpectedly.
 *
 * Also covers timeouts and other processing failures.
 */
export class ProcessError extends NvisyError {
	readonly code = "PROCESS_ERROR" as const;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}

/** The operation was explicitly cancelled. */
export class CancelledError extends NvisyError {
	readonly code = "CANCELLED_ERROR" as const;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, context, cause);
	}
}
