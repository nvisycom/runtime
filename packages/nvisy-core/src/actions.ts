/**
 * @module actions
 *
 * The Action concept — the contract for a stream transformation step
 * in the pipeline.
 */

import type { z } from "zod";
import type { Data } from "./datatypes/base-datatype.js";
import type { ClassRef } from "./types.js";

/** Stream transform that operates without a provider client. */
export type ClientlessTransformFn<TIn extends Data, TOut extends Data, TParam> = (
	stream: AsyncIterable<TIn>,
	params: TParam,
) => AsyncIterable<TOut>;

/** Stream transform that requires a provider client. */
export type ClientTransformFn<TClient, TIn extends Data, TOut extends Data, TParam> = (
	stream: AsyncIterable<TIn>,
	params: TParam,
	client: TClient,
) => AsyncIterable<TOut>;

export interface ClientlessActionConfig<TIn extends Data, TOut extends Data, TParam> {
	readonly types: [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>] | [inputClass: ClassRef<TIn>];
	readonly params: z.ZodType<TParam>;
	readonly transform: ClientlessTransformFn<TIn, TOut, TParam>;
}

export interface ClientActionConfig<TClient, TIn extends Data, TOut extends Data, TParam> {
	readonly types: [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>] | [inputClass: ClassRef<TIn>];
	readonly params: z.ZodType<TParam>;
	readonly transform: ClientTransformFn<TClient, TIn, TOut, TParam>;
}

export interface ActionInstance<
	TClient = void,
	TIn extends Data = Data,
	TOut extends Data = Data,
	TParam = unknown,
> {
	readonly id: string;
	readonly clientClass?: ClassRef<TClient>;
	readonly inputClass: ClassRef<TIn>;
	readonly outputClass: ClassRef<TOut>;
	readonly schema: z.ZodType<TParam>;
	pipe(stream: AsyncIterable<TIn>, params: TParam, client: TClient): AsyncIterable<TOut>;
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

	pipe(stream: AsyncIterable<TIn>, params: TParam, client: TClient): AsyncIterable<TOut> {
		return this.#transform(stream, params, client);
	}
}

export const Action: {
	withoutClient<TIn extends Data, TOut extends Data, TParam>(
		id: string,
		config: ClientlessActionConfig<TIn, TOut, TParam>,
	): ActionInstance<void, TIn, TOut, TParam>;
	withoutClient<TIn extends Data, TParam>(
		id: string,
		config: ClientlessActionConfig<TIn, TIn, TParam>,
	): ActionInstance<void, TIn, TIn, TParam>;

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
			transform: (stream, params, _client) => (config.transform as (stream: AsyncIterable<Data>, params: unknown) => AsyncIterable<Data>)(stream, params),
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
			transform: config.transform as (stream: AsyncIterable<Data>, params: unknown, client: unknown) => AsyncIterable<Data>,
		});
	},
};
