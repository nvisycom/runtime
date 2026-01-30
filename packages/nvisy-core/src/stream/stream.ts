/**
 * A value paired with a resumption context for interruptible reads.
 *
 * When a source is interrupted mid-stream, the {@link context} from the
 * last yielded `Resumable` can be passed back to resume iteration.
 *
 * @typeParam T   - The data item type.
 * @typeParam Ctx - The context type used for resumption.
 */
export class Resumable<T, Ctx> {
	readonly #data: T;
	readonly #context: Ctx;

	constructor(data: T, context: Ctx) {
		this.#data = data;
		this.#context = context;
	}

	/** The data item. */
	get data(): T {
		return this.#data;
	}

	/** Context that can be passed back to resume iteration. */
	get context(): Ctx {
		return this.#context;
	}
}

/**
 * A source that produces data items as an async iterable.
 *
 * Supports resumption via context — pass the {@link Resumable.context}
 * from the last yielded item to continue where a previous read left off.
 *
 * @typeParam T   - The data type yielded by the source.
 * @typeParam Ctx - Resumption context carried alongside each item.
 */
export interface DataSource<T, Ctx = void> {
	/** Stream items, optionally resuming from a previous context. */
	read(ctx: Ctx): AsyncIterable<Resumable<T, Ctx>>;
}

/**
 * A sink that accepts batches of data items.
 *
 * @typeParam T - The data type accepted by the sink.
 */
export interface DataSink<T> {
	/** Write a batch of items to the destination. */
	write(items: ReadonlyArray<T>): Promise<void>;
}
