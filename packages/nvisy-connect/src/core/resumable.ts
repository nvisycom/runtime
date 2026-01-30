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
