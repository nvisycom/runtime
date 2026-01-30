import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect";
import type { Row } from "@nvisy/core";
import type { ConnectionError, StorageError } from "@nvisy/core";
import type { DataInput, DataOutput } from "#core/stream.js";

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

// ── Error type ──────────────────────────────────────────────────────

/** Errors that may occur during relational operations. */
export type RelationalError = ConnectionError | StorageError;

// ── Service interface ───────────────────────────────────────────────

/**
 * Service interface for relational database connectors.
 *
 * Relational databases support both reading (via keyset pagination) and
 * writing. The connect/disconnect lifecycle is managed by the Layer.
 */
export interface RelationalDatabase
	extends
		DataInput<Row, RelationalContext, RelationalError>,
		DataOutput<Row, RelationalError> {}

// ── Context.Tag ─────────────────────────────────────────────────────

/** Effect service tag for relational database access. */
export class RelationalDb extends Context.Tag("@nvisy/connect/RelationalDb")<
	RelationalDb,
	RelationalDatabase
>() {}

// ── Layer factory ───────────────────────────────────────────────────

/**
 * Create a Layer that provides a {@link RelationalDatabase} service.
 *
 * The `connect` function should use `Effect.acquireRelease` to pair
 * connection establishment with teardown.
 */
export const makeRelationalLayer = <TCred>(config: {
	readonly creds: TCred;
	readonly params: RelationalParams;
	readonly connect: (
		creds: TCred,
		params: RelationalParams,
	) => Effect.Effect<RelationalDatabase, ConnectionError, Scope.Scope>;
}): Layer.Layer<RelationalDb, ConnectionError> =>
	Layer.scoped(RelationalDb, config.connect(config.creds, config.params));

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
