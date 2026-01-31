import type { DataType } from "#datatypes/index.js";

/**
 * A value paired with a resumption context for interruptible reads.
 *
 * When a source is interrupted mid-stream, the {@link context} from the
 * last yielded `Resumable` can be passed back to resume iteration.
 *
 * @typeParam TData - One of the concrete pipeline data types.
 * @typeParam TCtx  - The context type used for resumption.
 */
export interface Resumable<TData extends DataType = DataType, TCtx = void> {
	readonly data: TData;
	readonly context: TCtx;
}

/**
 * A source that produces data items as an async iterable.
 *
 * Supports resumption via context — pass the {@link Resumable.context}
 * from the last yielded item to continue where a previous read left off.
 *
 * @typeParam TData - One of the concrete pipeline data types.
 * @typeParam TCtx  - Resumption context carried alongside each item.
 */
export interface DataSource<TData extends DataType = DataType, TCtx = void> {
	/** Stream items, optionally resuming from a previous context. */
	read(ctx: TCtx): AsyncIterable<Resumable<TData, TCtx>>;
}

/**
 * A sink that accepts batches of data items.
 *
 * @typeParam TData - One of the concrete pipeline data types.
 */
export interface DataSink<TData extends DataType = DataType> {
	/** Write a batch of items to the destination. */
	write(items: ReadonlyArray<TData>): Promise<void>;
}
