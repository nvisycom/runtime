import { beforeAll, describe, expect, it } from "vitest";
import {
	ExampleClient,
	ExampleProvider,
	ExampleSource,
	ExampleTarget,
	TestRow,
} from "./provider.fixtures.js";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
	const result: T[] = [];
	for await (const item of iter) result.push(item);
	return result;
}

describe("ExampleProvider", () => {
	it("connect returns a managed instance with a client", async () => {
		const instance = await ExampleProvider.connect({
			host: "localhost",
			port: 5432,
		});
		expect(instance.id).toBe("example");
		expect(instance.client).toBeInstanceOf(ExampleClient);
	});
});

describe("ExampleSource", () => {
	let client: ExampleClient;

	beforeAll(async () => {
		const instance = await ExampleProvider.connect({
			host: "localhost",
			port: 5432,
		});
		client = instance.client;
	});

	it("reads all rows from offset 0", async () => {
		const collected = await collect(
			ExampleSource.read(client, { offset: 0 }, { table: "users" }),
		);

		expect(collected).toHaveLength(3);
		expect(collected[0]!.data.columns).toEqual({ id: "1", name: "Alice" });
		expect(collected[2]!.data.columns).toEqual({ id: "3", name: "Charlie" });
	});

	it("resumes from a given offset", async () => {
		const collected = await collect(
			ExampleSource.read(client, { offset: 2 }, { table: "users" }),
		);

		expect(collected).toHaveLength(1);
		expect(collected[0]!.data.columns).toEqual({ id: "3", name: "Charlie" });
	});

	it("yields correct resumption context", async () => {
		const collected = await collect(
			ExampleSource.read(client, { offset: 0 }, { table: "users" }),
		);
		const contexts = collected.map((r) => r.context);

		expect(contexts).toEqual([{ offset: 1 }, { offset: 2 }, { offset: 3 }]);
	});
});

describe("ExampleTarget", () => {
	let client: ExampleClient;

	beforeAll(async () => {
		const instance = await ExampleProvider.connect({
			host: "localhost",
			port: 5432,
		});
		client = instance.client;
	});

	it("writes a row without error", async () => {
		const row = new TestRow({ id: "4", name: "Diana" });
		const writer = ExampleTarget.write(client, { table: "users" });
		await writer(row);
	});
});
