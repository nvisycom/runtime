/**
 * @module base-stream
 *
 * Provides the {@link Stream} factory namespace for creating
 * {@link StreamSource} and {@link StreamTarget} implementations.
 *
 * Two factory methods cover the two directions of data flow:
 *
 * - {@link Stream.createSource} — reads data from an external system.
 * - {@link Stream.createTarget} — writes data to an external system.
 *
 * @example
 * ```ts
 * // SQL source — reads rows with keyset pagination
 * const read = Stream.createSource("read", SqlRuntimeClient, {
 *   types: [Row, SqlCursor, SqlParams],
 *   reader: readRows,
 * });
 *
 * // SQL target — batch-inserts rows
 * const write = Stream.createTarget("write", SqlRuntimeClient, {
 *   types: [Row, SqlParams],
 *   writer: writeRows,
 * });
 * ```
 */

import type { Schema } from "effect";
import type { DataType } from "#datatypes/index.js";
import type { ClassRef } from "#actions/action-types.js";
import type {
	ReaderFn,
	WriterFn,
	Resumable,
	SourceConfig,
	TargetConfig,
	StreamSource,
	StreamTarget,
} from "#streams/stream-types.js";

/**
 * Internal class backing all {@link StreamSource} values.
 */
class StreamSourceImpl<TClient, TData extends DataType, TCtx, TParam>
	implements StreamSource<TClient, TData, TCtx, TParam>
{
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly contextSchema: Schema.Schema<TCtx>;
	readonly paramSchema: Schema.Schema<TParam>;
	readonly #read: ReaderFn<TClient, TData, TCtx, TParam>;

	constructor(config: {
		id: string;
		clientClass: ClassRef<TClient>;
		dataClass: ClassRef<TData>;
		contextSchema: Schema.Schema<TCtx>;
		paramSchema: Schema.Schema<TParam>;
		read: ReaderFn<TClient, TData, TCtx, TParam>;
	}) {
		this.id = config.id;
		this.clientClass = config.clientClass;
		this.dataClass = config.dataClass;
		this.contextSchema = config.contextSchema;
		this.paramSchema = config.paramSchema;
		this.#read = config.read;
	}

	read(client: TClient, ctx: TCtx, params: TParam): AsyncIterable<Resumable<TData, TCtx>> {
		return this.#read(client, ctx, params);
	}
}

/**
 * Internal class backing all {@link StreamTarget} values.
 */
class StreamTargetImpl<TClient, TData extends DataType, TParam>
	implements StreamTarget<TClient, TData, TParam>
{
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly paramSchema: Schema.Schema<TParam>;
	readonly #write: WriterFn<TClient, TData, TParam>;

	constructor(config: {
		id: string;
		clientClass: ClassRef<TClient>;
		dataClass: ClassRef<TData>;
		paramSchema: Schema.Schema<TParam>;
		write: WriterFn<TClient, TData, TParam>;
	}) {
		this.id = config.id;
		this.clientClass = config.clientClass;
		this.dataClass = config.dataClass;
		this.paramSchema = config.paramSchema;
		this.#write = config.write;
	}

	write(client: TClient, items: ReadonlyArray<TData>, params: TParam): Promise<void> {
		return this.#write(client, items, params);
	}
}

/**
 * Factory namespace for creating {@link StreamSource} and
 * {@link StreamTarget} values.
 *
 * Prefer these factories over manual object construction — they
 * guarantee proper class instances with encapsulated internals.
 */
export const Stream = {
	/**
	 * Create a stream source that reads data from an external system.
	 *
	 * @param id - Unique identifier for this source (e.g. `"read"`).
	 * @param clientClass - Constructor reference for the provider client type.
	 * @param config - Source configuration.
	 * @param config.types - `[dataClass, contextSchema, paramSchema]`.
	 * @param config.reader - Async iterable factory that reads data from the external system.
	 *
	 * @example
	 * ```ts
	 * const read = Stream.createSource("read", SqlRuntimeClient, {
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
	createSource<TClient, TData extends DataType, TCtx, TParam>(
		id: string,
		clientClass: ClassRef<TClient>,
		config: SourceConfig<TClient, TData, TCtx, TParam>,
	): StreamSource<TClient, TData, TCtx, TParam> {
		const [dataClass, contextSchema, paramSchema] = config.types;
		return new StreamSourceImpl({
			id,
			clientClass,
			dataClass,
			contextSchema,
			paramSchema,
			read: config.reader,
		});
	},

	/**
	 * Create a stream target that writes data to an external system.
	 *
	 * @param id - Unique identifier for this target (e.g. `"write"`).
	 * @param clientClass - Constructor reference for the provider client type.
	 * @param config - Target configuration.
	 * @param config.types - `[dataClass, paramSchema]`.
	 * @param config.writer - Async function that persists a batch of data items.
	 *
	 * @example
	 * ```ts
	 * const write = Stream.createTarget("write", SqlRuntimeClient, {
	 *   types: [Row, SqlParams],
	 *   writer: async (client, items, params) => {
	 *     await client.insertBatch(params.table, items.map(r => r.toRecord()));
	 *   },
	 * });
	 * ```
	 */
	createTarget<TClient, TData extends DataType, TParam>(
		id: string,
		clientClass: ClassRef<TClient>,
		config: TargetConfig<TClient, TData, TParam>,
	): StreamTarget<TClient, TData, TParam> {
		const [dataClass, paramSchema] = config.types;
		return new StreamTargetImpl({
			id,
			clientClass,
			dataClass,
			paramSchema,
			write: config.writer,
		});
	},
} as const;
