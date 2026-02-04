import { z } from "zod";
import { Action } from "../src/actions.js";
import { Row } from "../src/datatypes/row-datatype.js";

export const FilterParams = z.object({
	column: z.string(),
	value: z.string(),
});
export type FilterParams = z.infer<typeof FilterParams>;

export const ExampleFilter = Action.withoutClient("filter", {
	types: [Row],
	params: FilterParams,
	transform: async function* (stream, params) {
		for await (const row of stream) {
			if (row.get(params.column) === params.value) yield row;
		}
	},
});

export const MapParams = z.object({
	column: z.string(),
	fn: z.enum(["uppercase", "lowercase"]),
});
export type MapParams = z.infer<typeof MapParams>;

export const ExampleMap = Action.withoutClient("map", {
	types: [Row],
	params: MapParams,
	transform: async function* (stream, params) {
		for await (const row of stream) {
			const val = row.get(params.column);
			if (typeof val !== "string") {
				yield row;
			} else {
				const mapped =
					params.fn === "uppercase" ? val.toUpperCase() : val.toLowerCase();
				yield new Row({ ...row.columns, [params.column]: mapped });
			}
		}
	},
});
