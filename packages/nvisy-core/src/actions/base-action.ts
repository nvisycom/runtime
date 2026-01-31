import type { Schema } from "effect";
import type { DataType } from "#datatypes/index.js";

/**
 * A named, parameterised data transformation.
 *
 * @typeParam TIn    - Input data type.
 * @typeParam TOut   - Output data type.
 * @typeParam TParam - Parameter type validated by {@link schema}.
 */
export interface ActionInstance<
	TIn extends DataType = DataType,
	TOut extends DataType = DataType,
	TParam = unknown,
> {
	readonly id: string;
	readonly inputClass: abstract new (...args: never[]) => TIn;
	readonly outputClass: abstract new (...args: never[]) => TOut;
	readonly schema: Schema.Schema<TParam>;
	execute(items: ReadonlyArray<TIn>, params: TParam): Promise<ReadonlyArray<TOut>>;
}

export const Action = {
	Define<TIn extends DataType, TOut extends DataType, TParam>(config: {
		id: string;
		inputClass: abstract new (...args: never[]) => TIn;
		outputClass: abstract new (...args: never[]) => TOut;
		schema: Schema.Schema<TParam>;
		execute: (items: ReadonlyArray<TIn>, params: TParam) => Promise<ReadonlyArray<TOut>>;
	}): ActionInstance<TIn, TOut, TParam> {
		return config;
	},
} as const;
