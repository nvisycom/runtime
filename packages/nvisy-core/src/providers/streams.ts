/**
 * A value paired with a resumption context for interruptible reads.
 *
 * When a source is interrupted mid-stream, the {@link context} from the
 * last yielded `Resumable` can be passed back to resume iteration.
 *
 * @typeParam TData - The data item type.
 * @typeParam TCtx  - The context type used for resumption.
 */
export class Resumable<TData, TCtx> {
	readonly #data: TData;
	readonly #context: TCtx;

	constructor(data: TData, context: TCtx) {
		this.#data = data;
		this.#context = context;
	}

	/** The data item. */
	get data(): TData {
		return this.#data;
	}

	/** Context that can be passed back to resume iteration. */
	get context(): TCtx {
		return this.#context;
	}
}

/**
 * A source that produces data items as an async iterable.
 *
 * Supports resumption via context — pass the {@link Resumable.context}
 * from the last yielded item to continue where a previous read left off.
 *
 * @typeParam TData - The data type yielded by the source.
 * @typeParam TCtx  - Resumption context carried alongside each item.
 */
export interface DataSource<TData, TCtx = void> {
	/** Stream items, optionally resuming from a previous context. */
	read(ctx: TCtx): AsyncIterable<Resumable<TData, TCtx>>;
}

/**
 * A sink that accepts batches of data items.
 *
 * @typeParam TData - The data type accepted by the sink.
 */
export interface DataSink<TData> {
	/** Write a batch of items to the destination. */
	write(items: ReadonlyArray<TData>): Promise<void>;
}
