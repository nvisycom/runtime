/** Structured context attached to every runtime error. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Readonly<Record<string, unknown>>;
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean;
	/** The underlying error that caused this one. */
	readonly cause?: Error | undefined;
}

/**
 * Base class for all Nvisy runtime errors.
 *
 * Every error carries a structured {@link ErrorContext} for logging and
 * debugging. Extends the built-in `Error` so `instanceof RuntimeError`
 * works everywhere.
 */
export class RuntimeError extends Error {
	readonly #context: ErrorContext;

	constructor(message: string, context?: ErrorContext) {
		super(message, context?.cause ? { cause: context.cause } : undefined);
		this.name = this.constructor.name;
		this.#context = context ?? {};
	}

	get context(): ErrorContext {
		return this.#context;
	}

	get source(): string | undefined {
		return this.#context.source;
	}

	get details(): Readonly<Record<string, unknown>> | undefined {
		return this.#context.details;
	}

	get retryable(): boolean | undefined {
		return this.#context.retryable;
	}
}
