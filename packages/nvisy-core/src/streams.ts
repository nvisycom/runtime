/**
 * @module streams
 *
 * The Stream concept — the data I/O layer that reads from and writes
 * to external systems.
 */

import type { z } from "zod";
import type { DataType } from "./datatypes/index.js";
import type { ClassRef } from "./types.js";

export interface Resumable<TData extends DataType = DataType, TCtx = void> {
	readonly data: TData;
	readonly context: TCtx;
}

/** Factory that reads data from an external system, returning an AsyncIterable. */
export type ReaderFn<TClient, TData extends DataType, TCtx, TParam> = (
	client: TClient,
	ctx: TCtx,
	params: TParam,
) => AsyncIterable<Resumable<TData, TCtx>>;

/** Factory that returns a writer function for persisting data items. */
export type WriterFn<TClient, TData extends DataType, TParam> = (
	client: TClient,
	params: TParam,
) => (item: TData) => Promise<void>;

export interface SourceConfig<TClient, TData extends DataType, TCtx, TParam> {
	readonly types: [
		dataClass: ClassRef<TData>,
		contextSchema: z.ZodType<TCtx>,
		paramSchema: z.ZodType<TParam>,
	];
	readonly reader: ReaderFn<TClient, TData, TCtx, TParam>;
}

export interface TargetConfig<TClient, TData extends DataType, TParam> {
	readonly types: [
		dataClass: ClassRef<TData>,
		paramSchema: z.ZodType<TParam>,
	];
	readonly writer: WriterFn<TClient, TData, TParam>;
}

export interface StreamSource<TClient, TData extends DataType, TCtx, TParam = void> {
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly contextSchema: z.ZodType<TCtx>;
	readonly paramSchema: z.ZodType<TParam>;
	read(client: TClient, ctx: TCtx, params: TParam): AsyncIterable<Resumable<TData, TCtx>>;
}

export interface StreamTarget<TClient, TData extends DataType, TParam = void> {
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly paramSchema: z.ZodType<TParam>;
	write(client: TClient, params: TParam): (item: TData) => Promise<void>;
}

class StreamSourceImpl<TClient, TData extends DataType, TCtx, TParam>
	implements StreamSource<TClient, TData, TCtx, TParam>
{
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly contextSchema: z.ZodType<TCtx>;
	readonly paramSchema: z.ZodType<TParam>;
	readonly #read: ReaderFn<TClient, TData, TCtx, TParam>;

	constructor(config: {
		id: string;
		clientClass: ClassRef<TClient>;
		dataClass: ClassRef<TData>;
		contextSchema: z.ZodType<TCtx>;
		paramSchema: z.ZodType<TParam>;
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

class StreamTargetImpl<TClient, TData extends DataType, TParam>
	implements StreamTarget<TClient, TData, TParam>
{
	readonly id: string;
	readonly clientClass: ClassRef<TClient>;
	readonly dataClass: ClassRef<TData>;
	readonly paramSchema: z.ZodType<TParam>;
	readonly #writer: WriterFn<TClient, TData, TParam>;

	constructor(config: {
		id: string;
		clientClass: ClassRef<TClient>;
		dataClass: ClassRef<TData>;
		paramSchema: z.ZodType<TParam>;
		writer: WriterFn<TClient, TData, TParam>;
	}) {
		this.id = config.id;
		this.clientClass = config.clientClass;
		this.dataClass = config.dataClass;
		this.paramSchema = config.paramSchema;
		this.#writer = config.writer;
	}

	write(client: TClient, params: TParam): (item: TData) => Promise<void> {
		return this.#writer(client, params);
	}
}

export const StreamFactory = {
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
			writer: config.writer,
		});
	},
} as const;
