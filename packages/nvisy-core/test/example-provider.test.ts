import { describe, it, expect, beforeAll } from "vitest";
import { Row } from "#datatypes/record-datatype.js";
import { ExampleProvider, Credentials, Params, Cursor } from "./example-provider.js";

describe("ExampleProvider", () => {
	it("exposes credential and param schemas on the factory", () => {
		expect(ExampleProvider.credentialSchema).toBe(Credentials);
		expect(ExampleProvider.paramSchema).toBe(Params);
	});

	it("connect returns a provider instance", async () => {
		const provider = await ExampleProvider.connect(
			{ host: "localhost", port: 5432 },
			{ table: "users" },
		);
		expect(provider).toBeDefined();
		expect(provider.id).toBe("example-db");
	});

	describe("instance", () => {
		let provider: Awaited<ReturnType<typeof ExampleProvider.connect>>;

		beforeAll(async () => {
			provider = await ExampleProvider.connect(
				{ host: "localhost", port: 5432 },
				{ table: "users" },
			);
		});

		it("exposes id", () => {
			expect(provider.id).toBe("example-db");
		});

		it("dataClass is Row", () => {
			expect(provider.dataClass).toBe(Row);
		});

		it("contextSchema is Cursor", () => {
			expect(provider.contextSchema).toBe(Cursor);
		});

		describe("createSource", () => {
			it("reads all rows from offset 0", async () => {
				const source = provider.createSource();
				const collected: Row[] = [];

				for await (const resumable of source.read({ offset: 0 })) {
					collected.push(resumable.data);
				}

				expect(collected).toHaveLength(3);
				expect(collected[0]!.columns).toEqual({ id: "1", name: "Alice" });
				expect(collected[2]!.columns).toEqual({ id: "3", name: "Charlie" });
			});

			it("resumes from a given offset", async () => {
				const source = provider.createSource();
				const collected: Row[] = [];

				for await (const resumable of source.read({ offset: 2 })) {
					collected.push(resumable.data);
				}

				expect(collected).toHaveLength(1);
				expect(collected[0]!.columns).toEqual({ id: "3", name: "Charlie" });
			});

			it("yields correct resumption context", async () => {
				const source = provider.createSource();
				const contexts: Cursor[] = [];

				for await (const resumable of source.read({ offset: 0 })) {
					contexts.push(resumable.context);
				}

				expect(contexts).toEqual([
					{ offset: 1 },
					{ offset: 2 },
					{ offset: 3 },
				]);
			});
		});

		describe("createSink", () => {
			it("accepts a batch of rows without throwing", async () => {
				const sink = provider.createSink();
				const row = new Row({ id: "4", name: "Diana" });
				await expect(sink.write([row])).resolves.toBeUndefined();
			});
		});
	});
});
