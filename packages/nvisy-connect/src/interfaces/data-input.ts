import type { Resumable } from "./resumable.js";

/**
 * A source that produces data items of type `T`.
 *
 * @typeParam T   - The data type yielded by the input.
 * @typeParam Ctx - Resumption context carried alongside each item.
 */
export interface DataInput<T, Ctx> {
	/** Iterate over items, optionally resuming from a previous context. */
	read(ctx: Ctx): AsyncIterable<Resumable<T, Ctx>>;
}
