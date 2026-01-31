import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const FilterParams = Schema.Struct({
	predicate: Schema.String,
});

export const filter = Action.Define({
	id: "filter",
	inputClass: Data,
	outputClass: Data,
	schema: FilterParams,
	execute: async (items, _params) => {
		// TODO: evaluate predicate expression from params
		return [...items];
	},
});
