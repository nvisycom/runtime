import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const ValidateParams = Schema.Struct({
	schema: Schema.String,
});

export const validate = Action.withoutClient("validate", {
	types: [Data],
	params: ValidateParams,
	execute: async (items, _params) => {
		// TODO: assert items match params.schema
		// TODO: route failures to DLQ
		return [...items];
	},
});
