import type { Effect, Stream } from "effect";

/**
 * A value paired with a resumption context, allowing interrupted
 * reads to continue from where they left off.
 *
 * When `data` is `null`, the stream has been exhausted.
 *
 * @typeParam T   - The data item type.
 * @typeParam Ctx - The context type used for resumption.
 */
  export class Resumable<T, Ctx> {
	/** The data item, or `null` if the stream is exhausted. */
	readonly data: T | null;
	/** Context that can be passed back to resume iteration. */
	readonly context: Ctx;

	constructor(data: T | null, context: Ctx) {
		this.data = data;
		this.context = context;
	}
}

/**
 * A source that produces data items of type `T` as an Effect Stream.
 *
 * @typeParam T   - The data type yielded by the input.
 * @typeParam Ctx - Resumption context carried alongside each item.
 * @typeParam E   - Error type that may occur during reading.
 */
export interface DataInput<T, Ctx, E> {
	/** Stream items, optionally resuming from a previous context. */
	readonly read: (ctx: Ctx) => Stream.Stream<Resumable<T, Ctx>, E>;
}

/**
 * A sink that accepts batches of data items of type `T`.
 *
 * @typeParam T - The data type accepted by the output.
 * @typeParam E - Error type that may occur during writing.
 */
export interface DataOutput<T, E> {
	/** Write a batch of items to the destination. */
	readonly write: (items: ReadonlyArray<T>) => Effect.Effect<void, E>;
}
