import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const MapParams = Schema.Struct({
	mapping: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export const map = Action.withoutClient("map", {
	types: [Data],
	params: MapParams,
	execute: async (items, _params) => {
		// TODO: apply field transformations from params
		return [...items];
	},
});
