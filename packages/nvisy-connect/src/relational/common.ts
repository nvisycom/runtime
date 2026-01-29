/** A page of results from keyset pagination. */
export interface KeysetPage<T> {
	/** Items in this page. */
	items: T[];
	/** Cursor to fetch the next page (undefined when exhausted). */
	nextCursor?: string;
}
