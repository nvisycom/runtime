import type { AnyDataValue } from "@nvisy/core";

/** Interface for all pipeline transform processors. */
export interface Process {
	process(input: AnyDataValue[]): Promise<AnyDataValue[]>;
}
