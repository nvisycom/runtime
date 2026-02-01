import { Schema } from "effect";

/**
 * Per-node parameters that describe what to read from or write to.
 *
 * Attached to each provider node in the workflow graph.
 */
export const SqlParams = Schema.Struct({
	/** Target table name. */
	table: Schema.String,
	/** Columns to select (empty array = `SELECT *`). */
	columns: Schema.Array(Schema.String),
	/** Primary sort column for keyset pagination (must be sequential / monotonic). */
	idColumn: Schema.String,
	/** Secondary sort column for stable ordering when `idColumn` values collide. */
	tiebreaker: Schema.String,
	/** Maximum rows per page during keyset pagination. */
	batchSize: Schema.Number,
});
export type SqlParams = typeof SqlParams.Type;

/**
 * Keyset pagination cursor for resumable reads.
 *
 * Both fields are `null` on the very first page and are updated after
 * each yielded row.
 */
export const SqlCursor = Schema.Struct({
	/** Last seen value of the `idColumn`, or `null` for the first page. */
	lastId: Schema.Union(Schema.Number, Schema.String, Schema.Null),
	/** Last seen value of the `tiebreaker` column, or `null` for the first page. */
	lastTiebreaker: Schema.Union(Schema.Number, Schema.String, Schema.Null),
});
export type SqlCursor = typeof SqlCursor.Type;
