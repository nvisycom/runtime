/** Structured context attached to every runtime error. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>>;
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean;
}

/**
 * Base class for all Nvisy runtime errors.
 *
 * Every error carries a structured {@link context} for logging and
 * debugging. Extends the built-in `Error` so `instanceof RuntimeError`
 * works everywhere — no framework dependency required.
 */
export class RuntimeError extends Error {
	/** Structured context about the failure. */
	readonly context: ErrorContext;

	constructor(message: string, context?: ErrorContext, cause?: Error) {
		super(message, cause ? { cause } : undefined);
		this.name = this.constructor.name;
		this.context = context ?? {};
	}
}
