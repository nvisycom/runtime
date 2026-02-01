/**
 * @module base-action
 *
 * Provides the {@link Action} factory namespace for creating
 * {@link ActionInstance} implementations.
 *
 * Two factory methods cover the two kinds of actions:
 *
 * - {@link Action.withoutClient} — pure transforms with no external dependency.
 * - {@link Action.withClient} — transforms that need a provider client.
 *
 * @example
 * ```ts
 * // Pure action — no client needed
 * const uppercase = Action.withoutClient("text/uppercase", {
 *   types: [Document],
 *   params: Schema.Struct({}),
 *   execute: async (items) =>
 *     items.map(doc => new Document(String(doc.content).toUpperCase())),
 * });
 *
 * // Client-dependent action — needs an AI provider
 * const embed = Action.withClient("ai/embed", LanguageModel, {
 *   types: [Document, Embedding],
 *   params: EmbedParams,
 *   execute: async (model, docs, params) =>
 *     model.embed(docs.map(d => d.content), params),
 * });
 * ```
 */

import type { Schema } from "effect";
import type { Data } from "#datatypes/base-datatype.js";
import type {
	ClassRef,
	ClientExecuteFn,
	ClientlessActionConfig,
	ClientActionConfig,
	ActionInstance,
} from "#actions/action-types.js";

/**
 * Internal class backing all {@link ActionInstance} values.
 *
 * The user-supplied `execute` function is stored in a `#private` field
 * so it cannot be reassigned or inspected after construction.
 */
class ActionImpl<TClient, TIn extends Data, TOut extends Data, TParam>
	implements ActionInstance<TClient, TIn, TOut, TParam>
{
	readonly id: string;
	readonly clientClass?: ClassRef<TClient>;
	readonly inputClass: ClassRef<TIn>;
	readonly outputClass: ClassRef<TOut>;
	readonly schema: Schema.Schema<TParam>;
	readonly #execute: ClientExecuteFn<TClient, TIn, TOut, TParam>;

	constructor(config: {
		id: string;
		clientClass?: ClassRef<TClient>;
		inputClass: ClassRef<TIn>;
		outputClass: ClassRef<TOut>;
		schema: Schema.Schema<TParam>;
		execute: ClientExecuteFn<TClient, TIn, TOut, TParam>;
	}) {
		this.id = config.id;
		if (config.clientClass) this.clientClass = config.clientClass;
		this.inputClass = config.inputClass;
		this.outputClass = config.outputClass;
		this.schema = config.schema;
		this.#execute = config.execute;
	}

	execute(client: TClient, items: ReadonlyArray<TIn>, params: TParam): Promise<ReadonlyArray<TOut>> {
		return this.#execute(client, items, params);
	}
}

/**
 * Factory namespace for creating {@link ActionInstance} values.
 *
 * Prefer these factories over manual object construction — they
 * guarantee the returned value is a proper class instance with
 * encapsulated internals.
 */
export const Action: {
	/**
	 * Create a pure action that requires no provider client.
	 *
	 * @param id - Unique action identifier (e.g. `"filter"`).
	 * @param config - Action configuration.
	 * @param config.types - `[inputClass]` or `[inputClass, outputClass]`. When output is omitted it defaults to input.
	 * @param config.params - Effect Schema for validating action parameters.
	 * @param config.execute - Async callback that transforms input items.
	 *
	 * @example
	 * ```ts
	 * const filter = Action.withoutClient("filter", {
	 *   types: [Row],
	 *   params: FilterParams,
	 *   execute: async (items, params) =>
	 *     items.filter(row => matchCondition(row, params)),
	 * });
	 * ```
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
	 * @typeParam TClient - The provider client type this action requires.
	 * @param id - Unique action identifier (e.g. `"embed"`).
	 * @param clientClass - Constructor reference for the client type.
	 * @param config - Action configuration.
	 * @param config.types - `[inputClass]` or `[inputClass, outputClass]`. When output is omitted it defaults to input.
	 * @param config.params - Effect Schema for validating action parameters.
	 * @param config.execute - Async callback that transforms input items using the client.
	 *
	 * @example
	 * ```ts
	 * const embed = Action.withClient("embed", LanguageModel, {
	 *   types: [Document, Embedding],
	 *   params: EmbedParams,
	 *   execute: async (model, docs, params) =>
	 *     model.embed(docs.map(d => d.content), params),
	 * });
	 * ```
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
			params: Schema.Schema<unknown>;
			execute: (...args: never[]) => Promise<ReadonlyArray<Data>>;
		},
	): ActionInstance<void, Data, Data, unknown> {
		const [inputClass, outputClass] = config.types;
		return new ActionImpl({
			id,
			inputClass,
			outputClass: outputClass ?? inputClass,
			schema: config.params,
			execute: (_client, items, params) => (config.execute as (items: ReadonlyArray<Data>, params: unknown) => Promise<ReadonlyArray<Data>>)(items, params),
		});
	},

	withClient(
		id: string,
		clientClass: ClassRef<unknown>,
		config: {
			types: [ClassRef<Data>] | [ClassRef<Data>, ClassRef<Data>];
			params: Schema.Schema<unknown>;
			execute: (...args: never[]) => Promise<ReadonlyArray<Data>>;
		},
	): ActionInstance<unknown, Data, Data, unknown> {
		const [inputClass, outputClass] = config.types;
		return new ActionImpl({
			id,
			clientClass,
			inputClass,
			outputClass: outputClass ?? inputClass,
			schema: config.params,
			execute: config.execute as (client: unknown, items: ReadonlyArray<Data>, params: unknown) => Promise<ReadonlyArray<Data>>,
		});
	},
};
