/**
 * Base error class and shared error interfaces for the Nvisy runtime.
 *
 * @module
 */

/** Structured context attached to runtime errors. */
export interface ErrorContext {
	/** Which component or subsystem produced the error. */
	readonly source?: string;
	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	readonly details?: Record<string, unknown>;
}

/** Options for constructing a RuntimeError. */
export interface RuntimeErrorOptions extends ErrorContext {
	/** Whether the caller may safely retry the operation. */
	readonly retryable?: boolean;
	/** The underlying error that caused this one. */
	readonly cause?: Error;
}

/**
 * Base class for all Nvisy runtime errors.
 *
 * Every error carries structured context for logging and debugging.
 * Extends the built-in `Error` so `instanceof RuntimeError` works everywhere.
 *
 * By default, runtime errors are retryable. Subclasses like `ValidationError`
 * override this to `false` since validation failures won't succeed on retry.
 *
 * @example
 * ```ts
 * throw new RuntimeError("Operation failed", {
 *   source: "engine",
 *   details: { nodeId: "abc" },
 * });
 *
 * // Wrap unknown errors
 * catch (error) {
 *   throw RuntimeError.wrap(error, { source: "provider" });
 * }
 * ```
 */
export class RuntimeError extends Error {
	readonly #source: string | undefined;
	readonly #details: Record<string, unknown> | undefined;
	readonly #retryable: boolean;

	constructor(message: string, options?: RuntimeErrorOptions) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = this.constructor.name;
		this.#source = options?.source;
		this.#details = options?.details;
		this.#retryable = options?.retryable ?? true;
	}

	/** Which component or subsystem produced the error. */
	get source(): string | undefined {
		return this.#source;
	}

	/** Machine-readable details about the failure (IDs, paths, limits, etc.). */
	get details(): Record<string, unknown> | undefined {
		return this.#details;
	}

	/** Whether the caller may safely retry the operation. */
	get retryable(): boolean {
		return this.#retryable;
	}

	/**
	 * Wrap an unknown error as a RuntimeError.
	 *
	 * If the error is already a RuntimeError, returns it unchanged.
	 * Otherwise, creates a new RuntimeError with the original as cause.
	 */
	static wrap(error: unknown, context?: ErrorContext): RuntimeError {
		if (error instanceof RuntimeError) return error;
		const message = error instanceof Error ? error.message : String(error);
		const cause = error instanceof Error ? error : undefined;
		return new RuntimeError(message, {
			...context,
			...(cause && { cause }),
		});
	}
}
