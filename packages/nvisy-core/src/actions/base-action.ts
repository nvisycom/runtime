import type { Data } from "#datatypes/base-datatype.js";

/**
 * An action that transforms data items.
 *
 * @typeParam TIn    - Input data type.
 * @typeParam TOut   - Output data type.
 * @typeParam TParam - Action-specific parameter type passed at execution time.
 */
export interface Action<
	TIn extends Data = Data,
	TOut extends Data = Data,
	TParam = unknown,
> {
	execute(
		items: ReadonlyArray<TIn>,
		params: TParam,
	): Promise<ReadonlyArray<TOut>>;
}

/**
 * Abstract helper that implements {@link Action} with a no-op default.
 *
 * Subclasses override {@link execute} to provide transformation logic.
 *
 * @typeParam TIn    - Input data type.
 * @typeParam TOut   - Output data type.
 * @typeParam TParam - Action-specific parameter type passed at execution time.
 */
export abstract class BaseAction<
	TIn extends Data = Data,
	TOut extends Data = Data,
	TParam = unknown,
> implements Action<TIn, TOut, TParam>
{
	abstract execute(
		items: ReadonlyArray<TIn>,
		params: TParam,
	): Promise<ReadonlyArray<TOut>>;
}
