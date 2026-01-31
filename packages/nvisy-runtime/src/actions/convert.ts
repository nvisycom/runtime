import { Schema } from "effect";
import { Action, Data } from "@nvisy/core";

const ConvertParams = Schema.Struct({
	to: Schema.Literal("document", "embedding", "blob", "row"),
});

export const convert = Action.Define({
	id: "convert",
	inputClass: Data,
	outputClass: Data,
	schema: ConvertParams,
	execute: async (items, _params) => {
		// TODO: cast between data types (Row → Document, etc.)
		return [...items];
	},
});
