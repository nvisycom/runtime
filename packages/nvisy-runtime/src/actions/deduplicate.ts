import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const DeduplicateParams = Schema.Struct({
	key: Schema.optional(Schema.String),
});

export const deduplicate = Action.withoutClient("deduplicate", {
	types: [Data],
	params: DeduplicateParams,
	execute: async (items, _params) => {
		// TODO: drop duplicates by _params.key ?? "id"
		return [...items];
	},
});
