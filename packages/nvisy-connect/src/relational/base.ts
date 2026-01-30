import type { Row } from "@nvisy/core";
import type { DataInput, DataOutput, Resumable } from "#core/stream.js";
import { Provider } from "#core/provider.js";

// ── Relational params ───────────────────────────────────────────────

/** Configuration parameters for a relational database connector. */
export interface RelationalParams {
	/** Target table name. */
	table: string;
	/** Database schema (e.g. `"public"`). */
	schema?: string;
	/** Number of rows to read/write per batch. */
	batchSize?: number;
}

/** Resumption context for relational reads (keyset pagination). */
export interface RelationalContext {
	/** Last-seen cursor value. */
	cursor?: string;
}

// ── Base class ──────────────────────────────────────────────────────

/**
 * Abstract base class for relational database connectors.
 *
 * Extends {@link Provider} to store credentials and configuration.
 * Subclasses implement read/write operations for a specific database
 * engine (PostgreSQL, MySQL, etc.). Reads use keyset pagination via
 * {@link RelationalContext}.
 */
export abstract class RelationalDatabase<
	TCred,
	TConfig extends RelationalParams = RelationalParams,
> extends Provider<TCred, TConfig>
	implements
		DataInput<Row, RelationalContext>,
		DataOutput<Row>
{
	abstract read(
		ctx: RelationalContext,
	): AsyncIterable<Resumable<Row, RelationalContext>>;
	abstract write(items: Row[]): Promise<void>;
}

// ── Utilities ───────────────────────────────────────────────────────

/**
 * A page of results from keyset pagination.
 *
 * @typeParam T - The item type in the page.
 */
export interface KeysetPage<T> {
	/** Items in this page. */
	items: T[];
	/** Cursor to fetch the next page (`undefined` when exhausted). */
	nextCursor?: string;
}
