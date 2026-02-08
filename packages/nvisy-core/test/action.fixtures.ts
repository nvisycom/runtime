import { z } from "zod";
import { Action } from "../src/action.js";
import type { JsonValue } from "../src/datatypes/data.js";
import { Data } from "../src/datatypes/data.js";

/** Minimal row-like data type for testing. */
export class TestRow extends Data {
	readonly #columns: Readonly<Record<string, JsonValue>>;

	constructor(columns: Record<string, JsonValue>) {
		super();
		this.#columns = columns;
	}

	get columns(): Readonly<Record<string, JsonValue>> {
		return this.#columns;
	}

	get(column: string): JsonValue | undefined {
		return this.#columns[column];
	}
}

export const FilterParams = z.object({
	column: z.string(),
	value: z.string(),
});
export type FilterParams = z.infer<typeof FilterParams>;

export const ExampleFilter = Action.withoutClient("filter", {
	types: [TestRow],
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
	types: [TestRow],
	params: MapParams,
	transform: async function* (stream, params) {
		for await (const row of stream) {
			const val = row.get(params.column);
			if (typeof val !== "string") {
				yield row;
			} else {
				const mapped =
					params.fn === "uppercase" ? val.toUpperCase() : val.toLowerCase();
				yield new TestRow({
					...row.columns,
					[params.column]: mapped,
				}).deriveFrom(row);
			}
		}
	},
});
