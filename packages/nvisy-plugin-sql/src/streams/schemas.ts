import { z } from "zod";

/**
 * Per-node parameters that describe what to read from or write to.
 *
 * Attached to each provider node in the workflow graph.
 */
export const SqlParams = z.object({
	/** Target table name. */
	table: z.string(),
	/** Columns to select (empty array = `SELECT *`). */
	columns: z.array(z.string()),
	/** Primary sort column for keyset pagination (must be sequential / monotonic). */
	idColumn: z.string(),
	/** Secondary sort column for stable ordering when `idColumn` values collide. */
	tiebreaker: z.string(),
	/** Maximum rows per page during keyset pagination. */
	batchSize: z.number(),
	/** Maximum total rows to yield. When omitted, all rows are read. */
	limit: z.number().int().positive().optional(),
});
export type SqlParams = z.infer<typeof SqlParams>;

/**
 * Keyset pagination cursor for resumable reads.
 *
 * Both fields are `null` on the very first page and are updated after
 * each yielded row.
 */
export const SqlCursor = z.object({
	/** Last seen value of the `idColumn`, or `null` for the first page. */
	lastId: z.union([z.number(), z.string(), z.null()]),
	/** Last seen value of the `tiebreaker` column, or `null` for the first page. */
	lastTiebreaker: z.union([z.number(), z.string(), z.null()]),
});
export type SqlCursor = z.infer<typeof SqlCursor>;
