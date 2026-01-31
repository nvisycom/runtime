import { Schema } from "effect";
import { Action } from "#actions/base-action.js";
import { Row } from "#datatypes/record-datatype.js";

export const FilterParams = Schema.Struct({
	column: Schema.String,
	value: Schema.String,
});
export type FilterParams = typeof FilterParams.Type;

export const ExampleFilter = Action.Define({
	id: "filter",
	inputClass: Row,
	outputClass: Row,
	schema: FilterParams,
	execute: async (items, params) =>
		items.filter((row) => row.get(params.column) === params.value),
});

export const MapParams = Schema.Struct({
	column: Schema.String,
	fn: Schema.Literal("uppercase", "lowercase"),
});
export type MapParams = typeof MapParams.Type;

export const ExampleMap = Action.Define({
	id: "map",
	inputClass: Row,
	outputClass: Row,
	schema: MapParams,
	execute: async (items, params) =>
		items.map((row) => {
			const val = row.get(params.column);
			if (typeof val !== "string") return row;
			const mapped = params.fn === "uppercase" ? val.toUpperCase() : val.toLowerCase();
			return new Row({ ...row.columns, [params.column]: mapped });
		}),
});
