import { describe, expect, it } from "vitest";
import type { ActionInstance } from "../src/actions/action.js";
import type { Data } from "../src/datatypes/data.js";
import { ExampleFilter, ExampleMap, TestRow } from "./action.fixtures.js";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
	const result: T[] = [];
	for await (const item of iter) result.push(item);
	return result;
}

async function* fromArray<T>(items: ReadonlyArray<T>): AsyncIterable<T> {
	yield* items;
}

async function runAction<TIn extends Data, TOut extends Data>(
	// biome-ignore lint/suspicious/noExplicitAny: generic test helper
	action: ActionInstance<void, TIn, TOut, any>,
	items: ReadonlyArray<TIn>,
	params: unknown,
): Promise<ReadonlyArray<TOut>> {
	const stream = action.pipe(fromArray(items), params, undefined as undefined);
	return collect(stream);
}

const rows = [
	new TestRow({ id: "1", name: "Alice" }),
	new TestRow({ id: "2", name: "Bob" }),
	new TestRow({ id: "3", name: "Charlie" }),
];

describe("ExampleFilter", () => {
	it("keeps rows matching the predicate", async () => {
		const result = await runAction(ExampleFilter, rows, {
			column: "name",
			value: "Bob",
		});

		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Bob");
	});

	it("returns empty array when nothing matches", async () => {
		const result = await runAction(ExampleFilter, rows, {
			column: "name",
			value: "Nobody",
		});

		expect(result).toHaveLength(0);
	});
});

describe("ExampleMap", () => {
	it("transforms column values to uppercase", async () => {
		const result = await runAction(ExampleMap, rows, {
			column: "name",
			fn: "uppercase",
		});

		expect(result).toHaveLength(3);
		expect(result[0]!.get("name")).toBe("ALICE");
		expect(result[1]!.get("name")).toBe("BOB");
		expect(result[2]!.get("name")).toBe("CHARLIE");
	});

	it("transforms column values to lowercase", async () => {
		const result = await runAction(ExampleMap, rows, {
			column: "name",
			fn: "lowercase",
		});

		expect(result[0]!.get("name")).toBe("alice");
	});

	it("leaves non-string columns unchanged", async () => {
		const result = await runAction(ExampleMap, rows, {
			column: "id",
			fn: "uppercase",
		});

		expect(result[0]!.get("id")).toBe("1");
		expect(result[0]!.get("name")).toBe("Alice");
	});
});
