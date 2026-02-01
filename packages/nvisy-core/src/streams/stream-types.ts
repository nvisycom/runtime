/**
 * @module stream-types
 *
 * Defines the interfaces for the Stream concept — the data I/O layer
 * that reads from and writes to external systems.
 *
 * A stream uses a provider's client to interact with the external world.
 * It does not manage connections — that is the responsibility of
 * {@link ProviderFactory}. Instead, a stream declares the client type it
 * needs (`TClient`) and receives a connected client at execution time.
 *
 * ## Relationship to Providers and Actions
 *
 * ```
 * Provider.connect(creds) → ProviderInstance { client }
 *                                  │
 *              ┌───────────────────┼───────────────────┐
 *              ▼                   ▼                   ▼
 *     StreamSource.read()   StreamTarget.write()    Action.execute()
 *        (client, ...)          (client, ...)        (client, ...)
 * ```
 *
 * The runtime resolves the provider → stream binding at graph compile
 * time by matching `TClient` types, then injects the connected client
 * at execution time.
 *
 * ## Resumable reads
 *
 * {@link StreamSource.read} yields {@link Resumable} values — each item
 * is paired with a context snapshot that allows the read to be resumed
 * from that point if interrupted. This enables checkpoint/restart
 * semantics for long-running ingestion pipelines.
 */

import type { Schema } from "effect";
import type { DataType } from "#datatypes/index.js";
import type { ClassRef } from "#actions/action-types.js";

/**
 * A value paired with a resumption context for interruptible reads.
 *
 * Each item yielded by a {@link StreamSource} carries both the data and
 * a context snapshot. When a source is interrupted mid-stream, the
 * {@link context} from the last successfully processed `Resumable` can
 * be passed back to {@link StreamSource.read} to resume iteration from
 * that checkpoint.
 *
 * @typeParam TData - The data type being streamed (must extend {@link DataType}).
 * @typeParam TCtx  - The resumption context type (e.g. a cursor, offset, or timestamp).
 *
 * @example
 * ```ts
 * // SQL source yields rows with a cursor context
 * const resumable: Resumable<Row, SqlCursor> = {
 *   data: new Row({ id: 42, name: "Alice" }),
 *   context: { lastId: 42 },
 * };
 * ```
 */
export interface Resumable<TData extends DataType = DataType, TCtx = void> {
	/** The streamed data item. */
	readonly data: TData;

	/**
	 * Context snapshot for resuming iteration from this point.
	 *
	 * Pass this value back to {@link StreamSource.read} to resume
	 * reading after this item. The shape is source-specific — for
	 * example, a SQL source might use `{ lastId: number }` while
	 * a file source might use `{ offset: number }`.
	 */
	readonly context: TCtx;
}

// ── Callback types ───────────────────────────────────────────────────

/** Async iterable factory that reads data from an external system. */
export type ReaderFn<TClient, TData extends DataType, TCtx, TParam> = (
	client: TClient,
	ctx: TCtx,
	params: TParam,
) => AsyncIterable<Resumable<TData, TCtx>>;

/** Async function that persists a batch of data items. */
export type WriterFn<TClient, TData extends DataType, TParam> = (
	client: TClient,
	items: ReadonlyArray<TData>,
	params: TParam,
) => Promise<void>;

// ── Config types ─────────────────────────────────────────────────────

/**
 * Configuration for {@link Stream.createSource}.
 */
export interface SourceConfig<TClient, TData extends DataType, TCtx, TParam> {
	readonly types: [
		dataClass: ClassRef<TData>,
		contextSchema: Schema.Schema<TCtx>,
		paramSchema: Schema.Schema<TParam>,
	];
	readonly reader: ReaderFn<TClient, TData, TCtx, TParam>;
}

/**
 * Configuration for {@link Stream.createTarget}.
 */
export interface TargetConfig<TClient, TData extends DataType, TParam> {
	readonly types: [
		dataClass: ClassRef<TData>,
		paramSchema: Schema.Schema<TParam>,
	];
	readonly writer: WriterFn<TClient, TData, TParam>;
}

// ── Instance interfaces ──────────────────────────────────────────────

/**
 * A named stream source that reads data from an external system via a
 * provider client.
 *
 * Sources are the entry points of a pipeline — they produce an async
 * stream of {@link Resumable} values that flow through action nodes
 * and eventually reach a stream target ({@link StreamTarget}).
 *
 * The `read` method is an async generator that yields items one at a
 * time (or in batches wrapped as individual yields). This lazy
 * evaluation model means the runtime can apply backpressure and
 * checkpoint progress incrementally.
 *
 * @typeParam TClient - Provider client type needed to read
 *                      (e.g. `SqlRuntime`, `S3Client`).
 * @typeParam TData   - The data type produced by this source
 *                      (must extend {@link DataType}).
 * @typeParam TCtx    - Resumption context type for checkpoint/restart.
 * @typeParam TParam  - Parameter type validated by {@link paramSchema}
 *                      at runtime (defaults to `void`).
 *
 * @example
 * ```ts
 * const sqlRead = Stream.createSource("read", SqlRuntimeClient, {
 *   types: [Row, SqlCursor, SqlParams],
 *   reader: async function* (client, ctx, params) {
 *     for await (const batch of client.query(params.table, ctx)) {
 *       for (const row of batch) {
 *         yield { data: new Row(row), context: { lastId: row.id } };
 *       }
 *     }
 *   },
 * });
 * ```
 */
export interface StreamSource<TClient, TData extends DataType, TCtx, TParam = void> {
	/** Unique identifier for this stream source (e.g. `"sql/read"`, `"s3/list"`). */
	readonly id: string;

	/** Constructor reference for the provider client type this source requires. Used by the runtime for compatibility checks. */
	readonly clientClass: ClassRef<TClient>;

	/** Abstract constructor of the data type this source produces. Used by the runtime for type checking. */
	readonly dataClass: ClassRef<TData>;

	/** Effect Schema for validating the resumption context at graph compile time. */
	readonly contextSchema: Schema.Schema<TCtx>;

	/** Effect Schema for validating source parameters at graph compile time. */
	readonly paramSchema: Schema.Schema<TParam>;

	/**
	 * Read data from the external system as an async iterable of
	 * resumable values.
	 *
	 * @param client - Connected provider client for the external system.
	 * @param ctx    - Resumption context from a previous read (or initial context).
	 * @param params - Validated parameters for this read operation.
	 * @returns An async iterable yielding data items paired with context snapshots.
	 */
	read(client: TClient, ctx: TCtx, params: TParam): AsyncIterable<Resumable<TData, TCtx>>;
}

/**
 * A named stream target that writes data to an external system via a
 * provider client.
 *
 * Targets are the terminal nodes of a pipeline — they receive a batch of
 * typed data items that have flowed through the graph and persist them
 * to the destination system.
 *
 * Unlike sources, targets operate on a complete batch rather than
 * streaming item-by-item. The runtime collects all upstream output
 * before invoking `write`.
 *
 * @typeParam TClient - Provider client type needed to write
 *                      (e.g. `SqlRuntime`, `S3Client`).
 * @typeParam TData   - The data type consumed by this target
 *                      (must extend {@link DataType}).
 * @typeParam TParam  - Parameter type validated by {@link paramSchema}
 *                      at runtime (defaults to `void`).
 *
 * @example
 * ```ts
 * const sqlWrite = Stream.createTarget("write", SqlRuntimeClient, {
 *   types: [Row, SqlParams],
 *   writer: async (client, items, params) => {
 *     await client.insertBatch(params.table, items.map(r => r.toRecord()));
 *   },
 * });
 * ```
 */
export interface StreamTarget<TClient, TData extends DataType, TParam = void> {
	/** Unique identifier for this stream target (e.g. `"sql/write"`, `"s3/upload"`). */
	readonly id: string;

	/** Constructor reference for the provider client type this target requires. Used by the runtime for compatibility checks. */
	readonly clientClass: ClassRef<TClient>;

	/** Abstract constructor of the data type this target accepts. Used by the runtime for type checking. */
	readonly dataClass: ClassRef<TData>;

	/** Effect Schema for validating target parameters at graph compile time. */
	readonly paramSchema: Schema.Schema<TParam>;

	/**
	 * Write a batch of data items to the external system.
	 *
	 * @param client - Connected provider client for the external system.
	 * @param items  - Batch of typed data items to persist.
	 * @param params - Validated parameters for this write operation.
	 */
	write(client: TClient, items: ReadonlyArray<TData>, params: TParam): Promise<void>;
}
