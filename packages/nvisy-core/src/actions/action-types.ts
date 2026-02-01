/**
 * @module action-types
 *
 * Defines the {@link ActionInstance} interface — the contract for a
 * data transformation step in the pipeline.
 *
 * Actions are the core unit of computation. They receive a batch of
 * typed input items and produce a batch of typed output items.
 * An action may optionally require a provider client (e.g. an AI model
 * handle) or be a pure transform that needs no external connection.
 *
 * Use {@link Action.withoutClient} to create pure actions and
 * {@link Action.withClient} to create client-dependent actions.
 */

import type { Schema } from "effect";
import type { Data } from "#datatypes/base-datatype.js";

// ── Shared helper type ───────────────────────────────────────────────

/** Constructor reference for runtime class checks. */
export type ClassRef<T> = abstract new (...args: never[]) => T;

// ── Callback types ───────────────────────────────────────────────────

/** Async transform that operates without a provider client. */
export type ClientlessExecuteFn<TIn extends Data, TOut extends Data, TParam> = (
	items: ReadonlyArray<TIn>,
	params: TParam,
) => Promise<ReadonlyArray<TOut>>;

/** Async transform that requires a provider client. */
export type ClientExecuteFn<TClient, TIn extends Data, TOut extends Data, TParam> = (
	client: TClient,
	items: ReadonlyArray<TIn>,
	params: TParam,
) => Promise<ReadonlyArray<TOut>>;

// ── Config types ─────────────────────────────────────────────────────

/**
 * Configuration for {@link Action.withoutClient}.
 *
 * `types` accepts `[inputClass]` (output defaults to input) or
 * `[inputClass, outputClass]` for distinct input/output types.
 */
export interface ClientlessActionConfig<TIn extends Data, TOut extends Data, TParam> {
	readonly types: [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>] | [inputClass: ClassRef<TIn>];
	readonly params: Schema.Schema<TParam>;
	readonly execute: ClientlessExecuteFn<TIn, TOut, TParam>;
}

/**
 * Configuration for {@link Action.withClient}.
 *
 * `types` accepts `[inputClass]` (output defaults to input) or
 * `[inputClass, outputClass]` for distinct input/output types.
 */
export interface ClientActionConfig<TClient, TIn extends Data, TOut extends Data, TParam> {
	readonly types: [inputClass: ClassRef<TIn>, outputClass: ClassRef<TOut>] | [inputClass: ClassRef<TIn>];
	readonly params: Schema.Schema<TParam>;
	readonly execute: ClientExecuteFn<TClient, TIn, TOut, TParam>;
}

// ── Instance interface ───────────────────────────────────────────────

/**
 * A named, parameterised data transformation step.
 *
 * Actions are stateless — all mutable context comes from the provider
 * client and the per-invocation params. The runtime can therefore
 * execute the same action instance across many graph nodes in parallel.
 *
 * @typeParam TClient - Provider client type, or `void` for pure transforms.
 * @typeParam TIn     - Input data type (must extend {@link Data}).
 * @typeParam TOut    - Output data type (must extend {@link Data}).
 * @typeParam TParam  - Parameter type validated by {@link schema} at runtime.
 *
 * @example
 * ```ts
 * // Pure action (TClient = void):
 * action.execute(undefined, rows, { predicate: "age > 30" });
 *
 * // Client-dependent action (TClient = LanguageModel):
 * action.execute(openaiClient, docs, { model: "gpt-4" });
 * ```
 */
export interface ActionInstance<
	TClient = void,
	TIn extends Data = Data,
	TOut extends Data = Data,
	TParam = unknown,
> {
	/** Unique identifier for this action (e.g. `"sql/filter"`, `"ai/embed"`). */
	readonly id: string;

	/**
	 * Constructor reference for the provider client type this action requires.
	 *
	 * Present for client-dependent actions ({@link Action.withClient}),
	 * `undefined` for pure transforms ({@link Action.withoutClient}).
	 */
	readonly clientClass?: ClassRef<TClient>;

	/** Abstract constructor of the expected input data type. Used by the runtime for type checking. */
	readonly inputClass: ClassRef<TIn>;

	/** Abstract constructor of the produced output data type. Used by the runtime for type checking. */
	readonly outputClass: ClassRef<TOut>;

	/** Effect Schema for validating action parameters at graph compile time. */
	readonly schema: Schema.Schema<TParam>;

	/**
	 * Transform a batch of input items into output items.
	 *
	 * @param client - Provider client instance, or `undefined` for pure actions.
	 * @param items  - Input batch to transform.
	 * @param params - Validated parameters for this invocation.
	 * @returns The transformed output batch.
	 */
	execute(client: TClient, items: ReadonlyArray<TIn>, params: TParam): Promise<ReadonlyArray<TOut>>;
}
