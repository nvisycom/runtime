import { describe, it, expect, beforeEach } from "vitest";
import { Row } from "@nvisy/core";
import type { SqlCursor } from "../src/shared/schemas.js";
import {
	mockProvider,
	testCreds,
	testParams,
	executedQueries,
	resetQueries,
} from "./helpers.js";

describe("makeSqlProvider with mock client", () => {
	beforeEach(() => {
		resetQueries();
	});

	it("connect returns a provider instance", async () => {
		const provider = await mockProvider.connect(testCreds, testParams);
		expect(provider).toBeDefined();
		expect(provider.id).toBe("mock-sql");
		expect(provider.dataClass).toBe(Row);
		await provider.disconnect?.();
	});

	describe("source (read)", () => {
		it("reads rows with null cursor (first page)", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			const source = provider.createSource();
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
			await provider.disconnect?.();
		});

		it("yields correct cursor progression", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			const source = provider.createSource();
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
			await provider.disconnect?.();
		});

		it("resumes from a given cursor", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			const source = provider.createSource();
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
			await provider.disconnect?.();
		});
	});

	describe("sink (write)", () => {
		it("accepts a batch of rows without throwing", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			const sink = provider.createSink();

			const rows = [
				new Row({ id: 4, name: "Diana", created_at: 400 }),
				new Row({ id: 5, name: "Eve", created_at: 500 }),
			];

			await expect(sink.write(rows)).resolves.toBeUndefined();

			const insertQuery = executedQueries.find((q) =>
				q.sql.includes("INSERT"),
			);
			expect(insertQuery).toBeDefined();
			await provider.disconnect?.();
		});

		it("handles empty batch gracefully", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			const sink = provider.createSink();
			await expect(sink.write([])).resolves.toBeUndefined();
			expect(
				executedQueries.filter((q) => q.sql.includes("INSERT")),
			).toHaveLength(0);
			await provider.disconnect?.();
		});
	});

	describe("disconnect", () => {
		it("can be called without error", async () => {
			const provider = await mockProvider.connect(testCreds, testParams);
			await expect(provider.disconnect?.()).resolves.toBeUndefined();
		});
	});
});
