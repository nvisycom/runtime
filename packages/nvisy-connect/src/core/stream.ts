/**
 * A value paired with a resumption context, allowing interrupted
 * reads to continue from where they left off.
 *
 * @typeParam T   - The data item type.
 * @typeParam Ctx - The context type used for resumption.
 */
export interface Resumable<T, Ctx> {
	/** The data item. */
	data: T;
	/** Context that can be passed back to resume iteration. */
	context: Ctx;
}

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

/**
 * A sink that accepts batches of data items of type `T`.
 *
 * Connectors that support writing (e.g. vector databases, relational
 * databases) implement this interface.
 *
 * @typeParam T - The data type accepted by the output.
 */
export interface DataOutput<T> {
	/** Write a batch of items to the destination. */
	write(items: T[]): Promise<void>;
}
