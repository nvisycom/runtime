import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Row } from "@nvisy/core";
import type {
	ProviderInstance,
	SourceProvider,
	SinkProvider,
} from "@nvisy/core";
import type { SqlCursor } from "../src/shared/schemas.js";
import type { QueryRecord } from "./helpers.js";
import { createMockProvider, testCreds } from "./helpers.js";

type ConnectedProvider = ProviderInstance<Row> &
	SourceProvider<Row, SqlCursor> &
	SinkProvider<Row>;

describe("makeSqlProvider with mock client", () => {
	let instance: ConnectedProvider;
	let queries: QueryRecord[];

	beforeEach(async () => {
		const mock = createMockProvider();
		queries = mock.queries;
		instance = (await mock.provider.connect(
			testCreds,
			mock.params,
		)) as ConnectedProvider;
	});

	afterEach(async () => {
		await instance.disconnect?.();
	});

	it("connect returns a provider instance", () => {
		expect(instance).toBeDefined();
		expect(instance.id).toBe("sql/mock");
		expect(instance.dataClass).toBe(Row);
	});

	describe("source (read)", () => {
		it("reads all rows with null cursor (first page)", async () => {
			const source = instance.createSource();
			const collected: Row[] = [];

			for await (const resumable of source.read({
				lastId: null,
				lastTiebreaker: null,
			})) {
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
			const source = instance.createSource();
			const cursors: SqlCursor[] = [];

			for await (const resumable of source.read({
				lastId: null,
				lastTiebreaker: null,
			})) {
				cursors.push(resumable.context);
			}

			expect(cursors).toEqual([
				{ lastId: 1, lastTiebreaker: 100 },
				{ lastId: 2, lastTiebreaker: 200 },
				{ lastId: 3, lastTiebreaker: 300 },
			]);
		});

		it("resumes from a given cursor", async () => {
			const source = instance.createSource();
			const collected: Row[] = [];

			for await (const resumable of source.read({
				lastId: 1,
				lastTiebreaker: 100,
			})) {
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

	describe("sink (write)", () => {
		it("issues INSERT for a batch of rows", async () => {
			const sink = instance.createSink();

			const rows = [
				new Row({ id: 4, name: "Diana", created_at: 400 }),
				new Row({ id: 5, name: "Eve", created_at: 500 }),
			];

			await sink.write(rows);

			const insertQueries = queries.filter((q) =>
				q.sql.includes("INSERT"),
			);
			expect(insertQueries).toHaveLength(1);
		});

		it("skips INSERT for an empty batch", async () => {
			const sink = instance.createSink();
			await sink.write([]);

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
	let instance: ConnectedProvider;
	let queries: QueryRecord[];

	beforeEach(async () => {
		const mock = createMockProvider({ batchSize: 2 });
		queries = mock.queries;
		instance = (await mock.provider.connect(
			testCreds,
			mock.params,
		)) as ConnectedProvider;
	});

	afterEach(async () => {
		await instance.disconnect?.();
	});

	it("fetches multiple pages when batchSize < total rows", async () => {
		const source = instance.createSource();
		const collected: Row[] = [];

		for await (const resumable of source.read({
			lastId: null,
			lastTiebreaker: null,
		})) {
			collected.push(resumable.data);
		}

		expect(collected).toHaveLength(3);

		// First page: 2 rows, second page: 1 row → 2 SELECT queries
		const selectQueries = queries.filter((q) => q.sql.includes("SELECT"));
		expect(selectQueries).toHaveLength(2);
	});

	it("second page resumes from the last cursor of the first page", async () => {
		const source = instance.createSource();
		const cursors: SqlCursor[] = [];

		for await (const resumable of source.read({
			lastId: null,
			lastTiebreaker: null,
		})) {
			cursors.push(resumable.context);
		}

		// After first page: cursor at (2, 200). Second page starts after that.
		expect(cursors[1]).toEqual({ lastId: 2, lastTiebreaker: 200 });
		expect(cursors[2]).toEqual({ lastId: 3, lastTiebreaker: 300 });
	});
});
