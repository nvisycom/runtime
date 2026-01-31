import type { Schema } from "effect";
import type { DataType } from "#datatypes/index.js";
import type {
	ProviderInstance,
	ProviderFactory,
	SourceProvider,
	SinkProvider,
} from "#providers/provider-types.js";
import type { Resumable, DataSource, DataSink } from "#providers/stream-types.js";

export interface SourceDescriptor<TClient, TData extends DataType, TCtx, TParam> {
	readonly contextSchema: Schema.Schema<TCtx>;
	readonly read: (client: TClient, ctx: TCtx, params: TParam) => AsyncIterable<Resumable<TData, TCtx>>;
}

export interface SinkDescriptor<TClient, TData extends DataType, TParam> {
	readonly write: (client: TClient, items: ReadonlyArray<TData>, params: TParam) => Promise<void>;
}

interface Buildable<TParam, TResult> {
	build(params: TParam): TResult;
}

type WithSource<TData extends DataType, TCtx> =
	ProviderInstance<TData> & SourceProvider<TData, TCtx>;

type WithSink<TData extends DataType> =
	ProviderInstance<TData> & SinkProvider<TData>;

type WithSourceAndSink<
	TData extends DataType,
	TCtx,
> = ProviderInstance<TData> & SourceProvider<TData, TCtx> & SinkProvider<TData>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ProviderImpl implements ProviderInstance<any> {
	readonly id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly dataClass: abstract new (...args: never[]) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#contextSchema?: Schema.Schema<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#source?: DataSource<any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#sink?: DataSink<any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(id: string, dataClass: abstract new (...args: never[]) => any) {
		this.id = id;
		this.dataClass = dataClass;
	}

	get contextSchema() {
		return this.#contextSchema!;
	}

	createSource() {
		return this.#source!;
	}

	createSink() {
		return this.#sink!;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_setSource(contextSchema: Schema.Schema<any>, source: DataSource<any, any>) {
		this.#contextSchema = contextSchema;
		this.#source = source;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_setSink(sink: DataSink<any>) {
		this.#sink = sink;
	}
}

class InstanceBuilder<TClient, TData extends DataType> {
	readonly #id: string;
	readonly #dataClass: abstract new (...args: never[]) => TData;
	readonly #client: TClient;

	constructor(
		id: string,
		dataClass: abstract new (...args: never[]) => TData,
		client: TClient,
	) {
		this.#id = id;
		this.#dataClass = dataClass;
		this.#client = client;
	}

	withSource<TCtx, TParam>(
		descriptor: SourceDescriptor<TClient, TData, TCtx, TParam>,
	): SourceBuilder<TClient, TData, TCtx, TParam> {
		return new SourceBuilder(this.#id, this.#dataClass, this.#client, descriptor);
	}

	withSink<TParam>(
		descriptor: SinkDescriptor<TClient, TData, TParam>,
	): SinkBuilder<TClient, TData, TParam> {
		return new SinkBuilder(this.#id, this.#dataClass, this.#client, descriptor);
	}

	build(): ProviderInstance<TData> {
		return new ProviderImpl(this.#id, this.#dataClass) as unknown as ProviderInstance<TData>;
	}
}

class SourceBuilder<TClient, TData extends DataType, TCtx, TParam>
	implements Buildable<TParam, WithSource<TData, TCtx>> {
	readonly #id: string;
	readonly #dataClass: abstract new (...args: never[]) => TData;
	readonly #client: TClient;
	readonly #source: SourceDescriptor<TClient, TData, TCtx, TParam>;

	constructor(
		id: string,
		dataClass: abstract new (...args: never[]) => TData,
		client: TClient,
		source: SourceDescriptor<TClient, TData, TCtx, TParam>,
	) {
		this.#id = id;
		this.#dataClass = dataClass;
		this.#client = client;
		this.#source = source;
	}

	withSink(
		descriptor: SinkDescriptor<TClient, TData, TParam>,
	): FullBuilder<TClient, TData, TCtx, TParam> {
		return new FullBuilder(this.#id, this.#dataClass, this.#client, this.#source, descriptor);
	}

	build(params: TParam): WithSource<TData, TCtx> {
		const impl = new ProviderImpl(this.#id, this.#dataClass);
		const client = this.#client;
		const readFn = this.#source.read;
		impl._setSource(this.#source.contextSchema, {
			read: (ctx: TCtx) => readFn(client, ctx, params),
		});
		return impl as unknown as WithSource<TData, TCtx>;
	}
}

class SinkBuilder<TClient, TData extends DataType, TParam>
	implements Buildable<TParam, WithSink<TData>> {
	readonly #id: string;
	readonly #dataClass: abstract new (...args: never[]) => TData;
	readonly #client: TClient;
	readonly #sink: SinkDescriptor<TClient, TData, TParam>;

	constructor(
		id: string,
		dataClass: abstract new (...args: never[]) => TData,
		client: TClient,
		sink: SinkDescriptor<TClient, TData, TParam>,
	) {
		this.#id = id;
		this.#dataClass = dataClass;
		this.#client = client;
		this.#sink = sink;
	}

	withSource<TCtx>(
		descriptor: SourceDescriptor<TClient, TData, TCtx, TParam>,
	): FullBuilder<TClient, TData, TCtx, TParam> {
		return new FullBuilder(this.#id, this.#dataClass, this.#client, descriptor, this.#sink);
	}

	build(params: TParam): WithSink<TData> {
		const impl = new ProviderImpl(this.#id, this.#dataClass);
		const client = this.#client;
		const writeFn = this.#sink.write;
		impl._setSink({
			write: (items: ReadonlyArray<TData>) => writeFn(client, items, params),
		});
		return impl as unknown as WithSink<TData>;
	}
}

class FullBuilder<TClient, TData extends DataType, TCtx, TParam>
	implements Buildable<TParam, WithSourceAndSink<TData, TCtx>> {
	readonly #id: string;
	readonly #dataClass: abstract new (...args: never[]) => TData;
	readonly #client: TClient;
	readonly #source: SourceDescriptor<TClient, TData, TCtx, TParam>;
	readonly #sink: SinkDescriptor<TClient, TData, TParam>;

	constructor(
		id: string,
		dataClass: abstract new (...args: never[]) => TData,
		client: TClient,
		source: SourceDescriptor<TClient, TData, TCtx, TParam>,
		sink: SinkDescriptor<TClient, TData, TParam>,
	) {
		this.#id = id;
		this.#dataClass = dataClass;
		this.#client = client;
		this.#source = source;
		this.#sink = sink;
	}

	build(params: TParam): WithSourceAndSink<TData, TCtx> {
		const impl = new ProviderImpl(this.#id, this.#dataClass);
		const client = this.#client;
		const readFn = this.#source.read;
		const writeFn = this.#sink.write;
		impl._setSource(this.#source.contextSchema, {
			read: (ctx: TCtx) => readFn(client, ctx, params),
		});
		impl._setSink({
			write: (items: ReadonlyArray<TData>) => writeFn(client, items, params),
		});
		return impl as unknown as WithSourceAndSink<TData, TCtx>;
	}
}

export const Provider = {
	Instance<TData extends DataType, TClient = void>(config: {
		id: string;
		dataClass: abstract new (...args: never[]) => TData;
		client?: TClient;
	}): InstanceBuilder<TClient, TData> {
		return new InstanceBuilder(config.id, config.dataClass, config.client as TClient);
	},

	Source<TClient, TData extends DataType, TCtx, TParam = void>(config: {
		contextSchema: Schema.Schema<TCtx>;
		read: (client: TClient, ctx: TCtx, params: TParam) => AsyncIterable<Resumable<TData, TCtx>>;
	}): SourceDescriptor<TClient, TData, TCtx, TParam> {
		return config;
	},

	Sink<TClient, TData extends DataType, TParam = void>(config: {
		write: (client: TClient, items: ReadonlyArray<TData>, params: TParam) => Promise<void>;
	}): SinkDescriptor<TClient, TData, TParam> {
		return config;
	},

	Factory<TCred, TParam, T extends ProviderInstance>(options: {
		credentialSchema: Schema.Schema<TCred>;
		paramSchema: Schema.Schema<TParam>;
		connect: (credentials: TCred, params: TParam) => Promise<Buildable<TParam, T>>;
	}): ProviderFactory<TCred, TParam, T> {
		return {
			credentialSchema: options.credentialSchema,
			paramSchema: options.paramSchema,
			connect: async (credentials, params) => {
				const builder = await options.connect(credentials, params);
				return builder.build(params);
			},
		};
	},
} as const;
