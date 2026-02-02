import { describe, it, expect, beforeAll } from "vitest";
import { Row } from "../src/datatypes/record-datatype.js";
import {
	ExampleProvider,
	ExampleProviderWithId,
	ExampleSource,
	ExampleTarget,
	ExampleClient,
	Credentials,
	Params,
	Cursor,
} from "./provider.js";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
	const result: T[] = [];
	for await (const item of iter) result.push(item);
	return result;
}

describe("ExampleProvider", () => {
	it("exposes credential schema on the factory", () => {
		expect(ExampleProvider.credentialSchema).toBe(Credentials);
	});

	it("exposes configurable factory ID", () => {
		expect(ExampleProviderWithId.id).toBe("custom-provider-id");
	});

	it("connect returns a provider instance with a client", async () => {
		const instance = await ExampleProvider.connect({ host: "localhost", port: 5432 });
		expect(instance).toBeDefined();
		expect(instance.id).toBe("example");
		expect(instance.client).toBeInstanceOf(ExampleClient);
	});

	it("disconnect resolves without error", async () => {
		const instance = await ExampleProvider.connect({ host: "localhost", port: 5432 });
		await expect(instance.disconnect()).resolves.toBeUndefined();
	});
});

describe("ExampleSource", () => {
	let client: ExampleClient;

	beforeAll(async () => {
		const instance = await ExampleProvider.connect({ host: "localhost", port: 5432 });
		client = instance.client;
	});

	it("exposes id, clientClass, dataClass, contextSchema, and paramSchema", () => {
		expect(ExampleSource.id).toBe("read");
		expect(ExampleSource.clientClass).toBe(ExampleClient);
		expect(ExampleSource.dataClass).toBe(Row);
		expect(ExampleSource.contextSchema).toBe(Cursor);
		expect(ExampleSource.paramSchema).toBe(Params);
	});

	it("reads all rows from offset 0", async () => {
		const collected = await collect(ExampleSource.read(client, { offset: 0 }, { table: "users" }));

		expect(collected).toHaveLength(3);
		expect(collected[0]!.data.columns).toEqual({ id: "1", name: "Alice" });
		expect(collected[2]!.data.columns).toEqual({ id: "3", name: "Charlie" });
	});

	it("resumes from a given offset", async () => {
		const collected = await collect(ExampleSource.read(client, { offset: 2 }, { table: "users" }));

		expect(collected).toHaveLength(1);
		expect(collected[0]!.data.columns).toEqual({ id: "3", name: "Charlie" });
	});

	it("yields correct resumption context", async () => {
		const collected = await collect(ExampleSource.read(client, { offset: 0 }, { table: "users" }));
		const contexts = collected.map((r) => r.context);

		expect(contexts).toEqual([{ offset: 1 }, { offset: 2 }, { offset: 3 }]);
	});
});

describe("ExampleTarget", () => {
	let client: ExampleClient;

	beforeAll(async () => {
		const instance = await ExampleProvider.connect({ host: "localhost", port: 5432 });
		client = instance.client;
	});

	it("exposes id, clientClass, dataClass, and paramSchema", () => {
		expect(ExampleTarget.id).toBe("write");
		expect(ExampleTarget.clientClass).toBe(ExampleClient);
		expect(ExampleTarget.dataClass).toBe(Row);
		expect(ExampleTarget.paramSchema).toBe(Params);
	});

	it("accepts a batch of rows without throwing", async () => {
		const row = new Row({ id: "4", name: "Diana" });
		const writer = ExampleTarget.write(client, { table: "users" });
		await expect(writer(row)).resolves.toBeUndefined();
	});
});
