import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Row } from "@nvisy/core";
import type { ProviderInstance } from "@nvisy/core";
import { SqlRuntimeClient } from "../src/providers/base.js";
import { read } from "../src/streams/read.js";
import { write } from "../src/streams/write.js";
import type { SqlCursor } from "../src/streams/schemas.js";
import type { QueryRecord } from "./helpers.js";
import { createMockProvider, testCreds } from "./helpers.js";

describe("makeSqlProvider with mock client", () => {
	let instance: ProviderInstance<SqlRuntimeClient>;
	let queries: QueryRecord[];
	let params: ReturnType<typeof createMockProvider>["params"];

	beforeEach(async () => {
		const mock = createMockProvider();
		queries = mock.queries;
		params = mock.params;
		instance = await mock.provider.connect(testCreds);
	});

	afterEach(async () => {
		await instance.disconnect?.();
	});

	it("connect returns a provider instance with a client", () => {
		expect(instance).toBeDefined();
		expect(instance.client).toBeInstanceOf(SqlRuntimeClient);
	});

	describe("source (read stream)", () => {
		it("reads all rows with null cursor (first page)", async () => {
			const collected: Row[] = [];

			for await (const resumable of read.read(instance.client, {
				lastId: null,
				lastTiebreaker: null,
			}, params)) {
				collected.push(resumable.data);
			}

			expect(collected).toHaveLength(3);
			expect(collected[0]!.columns).toMatchObject({ id: 1, name: "Alice" });
			expect(collected[2]!.columns).toMatchObject({
				id: 3,
				name: "Charlie",
			});
		});

		it("yields correct cursor progression", async () => {
			const cursors: SqlCursor[] = [];

			for await (const resumable of read.read(instance.client, {
				lastId: null,
				lastTiebreaker: null,
			}, params)) {
				cursors.push(resumable.context);
			}

			expect(cursors).toEqual([
				{ lastId: 1, lastTiebreaker: 100 },
				{ lastId: 2, lastTiebreaker: 200 },
				{ lastId: 3, lastTiebreaker: 300 },
			]);
		});

		it("resumes from a given cursor", async () => {
			const collected: Row[] = [];

			for await (const resumable of read.read(instance.client, {
				lastId: 1,
				lastTiebreaker: 100,
			}, params)) {
				collected.push(resumable.data);
			}

			expect(collected).toHaveLength(2);
			expect(collected[0]!.columns).toMatchObject({ id: 2, name: "Bob" });
			expect(collected[1]!.columns).toMatchObject({
				id: 3,
				name: "Charlie",
			});
		});
	});

	describe("target (write stream)", () => {
		it("issues INSERT for a batch of rows", async () => {
			const rows = [
				new Row({ id: 4, name: "Diana", created_at: 400 }),
				new Row({ id: 5, name: "Eve", created_at: 500 }),
			];

			await write.write(instance.client, rows, params);

			const insertQueries = queries.filter((q) =>
				q.sql.includes("INSERT"),
			);
			expect(insertQueries).toHaveLength(1);
		});

		it("skips INSERT for an empty batch", async () => {
			await write.write(instance.client, [], params);

			const insertQueries = queries.filter((q) =>
				q.sql.includes("INSERT"),
			);
			expect(insertQueries).toHaveLength(0);
		});
	});

	describe("disconnect", () => {
		it("can be called without error", async () => {
			await expect(instance.disconnect?.()).resolves.toBeUndefined();
		});
	});
});

describe("pagination with small batchSize", () => {
	let instance: ProviderInstance<SqlRuntimeClient>;
	let queries: QueryRecord[];
	let params: ReturnType<typeof createMockProvider>["params"];

	beforeEach(async () => {
		const mock = createMockProvider({ batchSize: 2 });
		queries = mock.queries;
		params = mock.params;
		instance = await mock.provider.connect(testCreds);
	});

	afterEach(async () => {
		await instance.disconnect?.();
	});

	it("fetches multiple pages when batchSize < total rows", async () => {
		const collected: Row[] = [];

		for await (const resumable of read.read(instance.client, {
			lastId: null,
			lastTiebreaker: null,
		}, params)) {
			collected.push(resumable.data);
		}

		expect(collected).toHaveLength(3);

		// First page: 2 rows, second page: 1 row → 2 SELECT queries
		const selectQueries = queries.filter((q) => q.sql.includes("SELECT"));
		expect(selectQueries).toHaveLength(2);
	});

	it("second page resumes from the last cursor of the first page", async () => {
		const cursors: SqlCursor[] = [];

		for await (const resumable of read.read(instance.client, {
			lastId: null,
			lastTiebreaker: null,
		}, params)) {
			cursors.push(resumable.context);
		}

		// After first page: cursor at (2, 200). Second page starts after that.
		expect(cursors[1]).toEqual({ lastId: 2, lastTiebreaker: 200 });
		expect(cursors[2]).toEqual({ lastId: 3, lastTiebreaker: 300 });
	});
});
