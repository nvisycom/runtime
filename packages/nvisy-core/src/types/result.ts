import type { NvisyError } from "../errors/base.js";

/**
 * Discriminated Result type for operations that can fail.
 * Prefer over throw/catch for expected errors in the pipeline.
 */
export type Result<T, E extends NvisyError = NvisyError> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E extends NvisyError>(error: E): Result<never, E> {
	return { ok: false, error };
}
