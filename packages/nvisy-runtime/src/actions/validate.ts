import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const ValidateParams = Schema.Struct({
	schema: Schema.String,
});

export const validate = Action.Define({
	id: "validate",
	inputClass: Data,
	outputClass: Data,
	schema: ValidateParams,
	execute: async (items, _params) => {
		// TODO: assert items match params.schema
		// TODO: route failures to DLQ
		return [...items];
	},
});
