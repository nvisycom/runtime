import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const MapParams = Schema.Struct({
	mapping: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export const map = Action.Define({
	id: "map",
	inputClass: Data,
	outputClass: Data,
	schema: MapParams,
	execute: async (items, _params) => {
		// TODO: apply field transformations from params
		return [...items];
	},
});
