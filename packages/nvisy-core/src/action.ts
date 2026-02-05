import type { z } from "zod";
import type { Data } from "./datatypes/data.js";
import type { ClassRef } from "./types.js";

/**
 * Stream transform that operates without a provider client.
 *
 * @template TIn - Input data type consumed by the transform.
 * @template TOut - Output data type produced by the transform.
 * @template TParam - Configuration parameters for the transform.
 */
export type ClientlessTransformFn<
	TIn extends Data,
	TOut extends Data,
	TParam,
> = (stream: AsyncIterable<TIn>, params: TParam) => AsyncIterable<TOut>;

/**
 * Stream transform that requires a provider client.
 *
 * @template TClient - Provider client type (e.g. database connection).
 * @template TIn - Input data type consumed by the transform.
 * @template TOut - Output data type produced by the transform.
 * @template TParam - Configuration parameters for the transform.
 */
export type ClientTransformFn<
	TClient,
	TIn extends Data,
	TOut extends Data,
	TParam,
> = (
	stream: AsyncIterable<TIn>,
	params: TParam,
	client: TClient,
) => AsyncIterable<TOut>;

/**
 * Configuration for creating an action that does not require a provider client.
 *
 * @template TIn - Input data type consumed by the action.
 * @template TOut - Output data type produced by the action.
 * @template TParam - Configuration parameters for the action.
 */
export interface ClientlessActionConfig<
	TIn extends Data,
	TOut extends Data,
	TParam,
> {
	/** Input/output type classes. Single-element array means input equals output. */
	readonly types:
		| [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>]
		| [inputClass: ClassRef<TIn>];
	/** Zod schema for validating action parameters. */
	readonly params: z.ZodType<TParam>;
	/** The transform function that processes the stream. */
	readonly transform: ClientlessTransformFn<TIn, TOut, TParam>;
}

/**
 * Configuration for creating an action that requires a provider client.
 *
 * @template TClient - Provider client type required by the action.
 * @template TIn - Input data type consumed by the action.
 * @template TOut - Output data type produced by the action.
 * @template TParam - Configuration parameters for the action.
 */
export interface ClientActionConfig<
	TClient,
	TIn extends Data,
	TOut extends Data,
	TParam,
> {
	/** Input/output type classes. Single-element array means input equals output. */
	readonly types:
		| [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>]
		| [inputClass: ClassRef<TIn>];
	/** Zod schema for validating action parameters. */
	readonly params: z.ZodType<TParam>;
	/** The transform function that processes the stream with client access. */
	readonly transform: ClientTransformFn<TClient, TIn, TOut, TParam>;
}

/**
 * A registered action instance that can transform data streams.
 *
 * Actions are the intermediate processing steps in a pipeline,
 * transforming data between sources and targets.
 *
 * @template TClient - Provider client type (void if no client needed).
 * @template TIn - Input data type consumed by the action.
 * @template TOut - Output data type produced by the action.
 * @template TParam - Configuration parameters for the action.
 */
export interface ActionInstance<
	TClient = void,
	TIn extends Data = Data,
	TOut extends Data = Data,
	TParam = unknown,
> {
	/** Unique identifier for this action. */
	readonly id: string;
	/** Client class required by this action (undefined if clientless). */
	readonly clientClass?: ClassRef<TClient>;
	/** Class reference for validating input data type. */
	readonly inputClass: ClassRef<TIn>;
	/** Class reference for validating output data type. */
	readonly outputClass: ClassRef<TOut>;
	/** Zod schema for validating action parameters. */
	readonly schema: z.ZodType<TParam>;
	/** Transform an input stream into an output stream. */
	pipe(
		stream: AsyncIterable<TIn>,
		params: TParam,
		client: TClient,
	): AsyncIterable<TOut>;
}

class ActionImpl<TClient, TIn extends Data, TOut extends Data, TParam>
	implements ActionInstance<TClient, TIn, TOut, TParam>
{
	readonly id: string;
	readonly clientClass?: ClassRef<TClient>;
	readonly inputClass: ClassRef<TIn>;
	readonly outputClass: ClassRef<TOut>;
	readonly schema: z.ZodType<TParam>;
	readonly #transform: ClientTransformFn<TClient, TIn, TOut, TParam>;

	constructor(config: {
		id: string;
		clientClass?: ClassRef<TClient>;
		inputClass: ClassRef<TIn>;
		outputClass: ClassRef<TOut>;
		schema: z.ZodType<TParam>;
		transform: ClientTransformFn<TClient, TIn, TOut, TParam>;
	}) {
		this.id = config.id;
		if (config.clientClass) this.clientClass = config.clientClass;
		this.inputClass = config.inputClass;
		this.outputClass = config.outputClass;
		this.schema = config.schema;
		this.#transform = config.transform;
	}

	pipe(
		stream: AsyncIterable<TIn>,
		params: TParam,
		client: TClient,
	): AsyncIterable<TOut> {
		return this.#transform(stream, params, client);
	}
}

/** Factory for creating action instances. */
export const Action: {
	/**
	 * Create an action that does not require a provider client.
	 *
	 * @param id - Unique identifier for the action.
	 * @param config - Action configuration including types and transform.
	 */
	withoutClient<TIn extends Data, TOut extends Data, TParam>(
		id: string,
		config: ClientlessActionConfig<TIn, TOut, TParam>,
	): ActionInstance<void, TIn, TOut, TParam>;
	withoutClient<TIn extends Data, TParam>(
		id: string,
		config: ClientlessActionConfig<TIn, TIn, TParam>,
	): ActionInstance<void, TIn, TIn, TParam>;

	/**
	 * Create an action that requires a provider client.
	 *
	 * @param id - Unique identifier for the action.
	 * @param clientClass - Class reference for the required provider client.
	 * @param config - Action configuration including types and transform.
	 */
	withClient<TClient, TIn extends Data, TOut extends Data, TParam>(
		id: string,
		clientClass: ClassRef<TClient>,
		config: ClientActionConfig<TClient, TIn, TOut, TParam>,
	): ActionInstance<TClient, TIn, TOut, TParam>;
	withClient<TClient, TIn extends Data, TParam>(
		id: string,
		clientClass: ClassRef<TClient>,
		config: ClientActionConfig<TClient, TIn, TIn, TParam>,
	): ActionInstance<TClient, TIn, TIn, TParam>;
} = {
	withoutClient(
		id: string,
		config: {
			types: [ClassRef<Data>] | [ClassRef<Data>, ClassRef<Data>];
			params: z.ZodType<unknown>;
			transform: (...args: never[]) => AsyncIterable<Data>;
		},
	): ActionInstance<void, Data, Data, unknown> {
		const [inputClass, outputClass] = config.types;
		return new ActionImpl({
			id,
			inputClass,
			outputClass: outputClass ?? inputClass,
			schema: config.params,
			transform: (stream, params, _client) =>
				(
					config.transform as (
						stream: AsyncIterable<Data>,
						params: unknown,
					) => AsyncIterable<Data>
				)(stream, params),
		});
	},

	withClient(
		id: string,
		clientClass: ClassRef<unknown>,
		config: {
			types: [ClassRef<Data>] | [ClassRef<Data>, ClassRef<Data>];
			params: z.ZodType<unknown>;
			transform: (...args: never[]) => AsyncIterable<Data>;
		},
	): ActionInstance<unknown, Data, Data, unknown> {
		const [inputClass, outputClass] = config.types;
		return new ActionImpl({
			id,
			clientClass,
			inputClass,
			outputClass: outputClass ?? inputClass,
			schema: config.params,
			transform: config.transform as (
				stream: AsyncIterable<Data>,
				params: unknown,
				client: unknown,
			) => AsyncIterable<Data>,
		});
	},
};
