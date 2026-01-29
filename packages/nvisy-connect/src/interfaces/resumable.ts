/**
 * A value paired with a resumption context, allowing interrupted
 * reads to continue from where they left off.
 */
export interface Resumable<T, Ctx> {
	/** The data item. */
	data: T;
	/** Context that can be passed back to resume iteration. */
	context: Ctx;
}
