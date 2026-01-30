import type { AnyDataValue, Data } from "@nvisy/core";

/**
 * Abstract base class for all pipeline processors.
 *
 * Every transform step in the pipeline — partition, chunk, embed, enrich,
 * extract, etc. — extends this class and implements {@link process}.
 *
 * @typeParam TIn  - Input data type (defaults to {@link AnyDataValue}).
 * @typeParam TOut - Output data type (defaults to {@link AnyDataValue}).
 */
export abstract class Processor<
	TIn extends Data = AnyDataValue,
	TOut extends Data = AnyDataValue,
> {
	abstract process(input: TIn[]): Promise<TOut[]>;
}
