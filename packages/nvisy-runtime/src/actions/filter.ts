import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const FilterParams = Schema.Struct({
	predicate: Schema.String,
});

export const filter = Action.withoutClient("filter", {
	types: [Data],
	params: FilterParams,
	execute: async (items, _params) => {
		// TODO: evaluate predicate expression from params
		return [...items];
	},
});
