import type { AnyData, Data } from "@nvisy/core";

/**
 * Abstract base class for all pipeline processors.
 *
 * Every transform step in the pipeline — partition, chunk, embed, enrich,
 * extract, etc. — extends this class and implements {@link process}.
 *
 * @typeParam TIn  - Input data type (defaults to {@link AnyData}).
 * @typeParam TOut - Output data type (defaults to {@link AnyData}).
 */
export abstract class Processor<
	TIn extends Data = AnyData,
	TOut extends Data = AnyData,
> {
	abstract process(input: TIn[]): Promise<TOut[]>;
}
