import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
	SqlCredentials,
	SqlParams,
	SqlCursor,
} from "../src/shared/schemas.js";

describe("SqlCredentials schema", () => {
	it("accepts valid credentials", () => {
		const result = Schema.decodeUnknownSync(SqlCredentials)({
			host: "localhost",
			port: 5432,
			database: "testdb",
			username: "admin",
			password: "secret",
		});
		expect(result.host).toBe("localhost");
		expect(result.port).toBe(5432);
	});

	it("rejects missing fields", () => {
		expect(() =>
			Schema.decodeUnknownSync(SqlCredentials)({
				host: "localhost",
			}),
		).toThrow();
	});
});

describe("SqlParams schema", () => {
	it("accepts valid params", () => {
		const result = Schema.decodeUnknownSync(SqlParams)({
			table: "users",
			columns: ["id", "name"],
			idColumn: "id",
			tiebreaker: "created_at",
			batchSize: 500,
		});
		expect(result.table).toBe("users");
		expect(result.columns).toEqual(["id", "name"]);
		expect(result.batchSize).toBe(500);
	});

	it("rejects missing required fields", () => {
		expect(() =>
			Schema.decodeUnknownSync(SqlParams)({ table: "users" }),
		).toThrow();
	});
});

describe("SqlCursor schema", () => {
	it("accepts null cursor values", () => {
		const result = Schema.decodeUnknownSync(SqlCursor)({
			lastId: null,
			lastTiebreaker: null,
		});
		expect(result.lastId).toBeNull();
		expect(result.lastTiebreaker).toBeNull();
	});

	it("accepts numeric cursor values", () => {
		const result = Schema.decodeUnknownSync(SqlCursor)({
			lastId: 42,
			lastTiebreaker: 100,
		});
		expect(result.lastId).toBe(42);
	});

	it("accepts string cursor values", () => {
		const result = Schema.decodeUnknownSync(SqlCursor)({
			lastId: "abc",
			lastTiebreaker: "def",
		});
		expect(result.lastId).toBe("abc");
	});
});
