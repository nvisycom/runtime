import type { Resumable } from "#core/resumable.js";

/**
 * A source that produces data items of type `T`.
 *
 * Connectors that support reading (e.g. object stores, relational databases)
 * implement this interface. Reads are resumable — each yielded item includes
 * a {@link Resumable.context} that can be passed back to continue iteration
 * after an interruption.
 *
 * @typeParam T   - The data type yielded by the input.
 * @typeParam Ctx - Resumption context carried alongside each item.
 */
export interface DataInput<T, Ctx> {
	/** Iterate over items, optionally resuming from a previous context. */
	read(ctx: Ctx): AsyncIterable<Resumable<T, Ctx>>;
}
