import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const BatchParams = Schema.Struct({
	size: Schema.optional(Schema.Number),
});

export const batch = Action.Define({
	id: "batch",
	inputClass: Data,
	outputClass: Data,
	schema: BatchParams,
	execute: async (items, _params) => {
		// TODO: group items into batches of _params.size ?? 100
		return [...items];
	},
});
