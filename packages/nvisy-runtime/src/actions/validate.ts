import { z } from "zod";
import { Action, Data } from "@nvisy/core";

const ValidateParams = z.object({
	schema: z.string(),
});

export const validate = Action.withoutClient("validate", {
	types: [Data],
	params: ValidateParams,
	transform: (stream, _params) => {
		// TODO: assert items match params.schema
		// TODO: route failures to DLQ
		return stream;
	},
});
