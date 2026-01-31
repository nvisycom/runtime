import { describe, it, expect } from "vitest";
import { Row } from "@nvisy/core";
import { filter } from "../src/actions/filter.js";
import { project } from "../src/actions/project.js";
import { rename } from "../src/actions/rename.js";
import { coerce } from "../src/actions/coerce.js";

const rows = [
	new Row({ id: 1, name: "Alice", age: 30, city: "NYC" }),
	new Row({ id: 2, name: "Bob", age: 25, city: "LA" }),
	new Row({ id: 3, name: "Charlie", age: 35, city: "NYC" }),
	new Row({ id: 4, name: "Diana", age: null, city: "SF" }),
];

/* ------------------------------------------------------------------ */
/*  filter                                                             */
/* ------------------------------------------------------------------ */

describe("filter action", () => {
	it("filters by eq", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "city", op: "eq", value: "NYC" }],
		});
		expect(result).toHaveLength(2);
		expect(result[0]!.get("name")).toBe("Alice");
		expect(result[1]!.get("name")).toBe("Charlie");
	});

	it("filters by neq", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "city", op: "neq", value: "NYC" }],
		});
		expect(result).toHaveLength(2);
		expect(result[0]!.get("name")).toBe("Bob");
		expect(result[1]!.get("name")).toBe("Diana");
	});

	it("filters by gt", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "gt", value: 28 }],
		});
		expect(result).toHaveLength(2);
		expect(result[0]!.get("name")).toBe("Alice");
		expect(result[1]!.get("name")).toBe("Charlie");
	});

	it("filters by gte", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "gte", value: 30 }],
		});
		expect(result).toHaveLength(2);
	});

	it("filters by lt", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "lt", value: 30 }],
		});
		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Bob");
	});

	it("filters by lte", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "lte", value: 25 }],
		});
		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Bob");
	});

	it("filters by in", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "city", op: "in", value: ["NYC", "SF"] }],
		});
		expect(result).toHaveLength(3);
	});

	it("filters by notIn", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "city", op: "notIn", value: ["NYC", "SF"] }],
		});
		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Bob");
	});

	it("filters by isNull", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "isNull" }],
		});
		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Diana");
	});

	it("filters by isNotNull", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "isNotNull" }],
		});
		expect(result).toHaveLength(3);
	});

	it("combines conditions with AND (default)", async () => {
		const result = await filter.execute(rows, {
			conditions: [
				{ column: "city", op: "eq", value: "NYC" },
				{ column: "age", op: "gt", value: 30 },
			],
		});
		expect(result).toHaveLength(1);
		expect(result[0]!.get("name")).toBe("Charlie");
	});

	it("combines conditions with OR", async () => {
		const result = await filter.execute(rows, {
			conditions: [
				{ column: "city", op: "eq", value: "LA" },
				{ column: "age", op: "gt", value: 30 },
			],
			mode: "or",
		});
		expect(result).toHaveLength(2);
	});

	it("returns all rows when conditions are empty", async () => {
		const result = await filter.execute(rows, { conditions: [] });
		expect(result).toHaveLength(4);
	});
});

/* ------------------------------------------------------------------ */
/*  project                                                            */
/* ------------------------------------------------------------------ */

describe("project action", () => {
	it("keeps specified columns", async () => {
		const result = await project.execute(rows, { keep: ["id", "name"] });
		expect(result).toHaveLength(4);
		expect(Object.keys(result[0]!.columns)).toEqual(["id", "name"]);
		expect(result[0]!.get("name")).toBe("Alice");
	});

	it("drops specified columns", async () => {
		const result = await project.execute(rows, { drop: ["age", "city"] });
		expect(result).toHaveLength(4);
		expect(Object.keys(result[0]!.columns)).toEqual(["id", "name"]);
	});

	it("preserves row id and metadata", async () => {
		const original = new Row(
			{ a: 1, b: 2 },
			{ id: "test-id", metadata: { source: "test" } },
		);
		const result = await project.execute([original], { keep: ["a"] });
		expect(result[0]!.id).toBe("test-id");
		expect(result[0]!.metadata).toEqual({ source: "test" });
	});

	it("ignores missing columns in keep", async () => {
		const result = await project.execute(rows, {
			keep: ["id", "nonexistent"],
		});
		expect(Object.keys(result[0]!.columns)).toEqual(["id"]);
	});
});

/* ------------------------------------------------------------------ */
/*  rename                                                             */
/* ------------------------------------------------------------------ */

describe("rename action", () => {
	it("renames columns according to mapping", async () => {
		const result = await rename.execute(rows, {
			mapping: { name: "full_name", city: "location" },
		});
		expect(result[0]!.get("full_name")).toBe("Alice");
		expect(result[0]!.get("location")).toBe("NYC");
		expect(result[0]!.get("name")).toBeUndefined();
		expect(result[0]!.get("city")).toBeUndefined();
	});

	it("preserves columns not in the mapping", async () => {
		const result = await rename.execute(rows, {
			mapping: { name: "full_name" },
		});
		expect(result[0]!.get("id")).toBe(1);
		expect(result[0]!.get("age")).toBe(30);
		expect(result[0]!.get("city")).toBe("NYC");
	});

	it("preserves row id and metadata", async () => {
		const original = new Row(
			{ a: 1 },
			{ id: "test-id", metadata: { source: "test" } },
		);
		const result = await rename.execute([original], {
			mapping: { a: "b" },
		});
		expect(result[0]!.id).toBe("test-id");
		expect(result[0]!.metadata).toEqual({ source: "test" });
	});

	it("handles empty mapping (no-op)", async () => {
		const result = await rename.execute(rows, { mapping: {} });
		expect(result[0]!.columns).toEqual(rows[0]!.columns);
	});
});

/* ------------------------------------------------------------------ */
/*  coerce                                                             */
/* ------------------------------------------------------------------ */

describe("coerce action", () => {
	it("coerces number to string", async () => {
		const result = await coerce.execute(rows, {
			columns: { id: "string" },
		});
		expect(result[0]!.get("id")).toBe("1");
		expect(typeof result[0]!.get("id")).toBe("string");
	});

	it("coerces string to number", async () => {
		const input = [new Row({ value: "42" })];
		const result = await coerce.execute(input, {
			columns: { value: "number" },
		});
		expect(result[0]!.get("value")).toBe(42);
	});

	it("returns null for non-numeric string coerced to number", async () => {
		const input = [new Row({ value: "not-a-number" })];
		const result = await coerce.execute(input, {
			columns: { value: "number" },
		});
		expect(result[0]!.get("value")).toBeNull();
	});

	it("coerces to boolean", async () => {
		const input = [new Row({ flag: 0, active: "yes", empty: "" })];
		const result = await coerce.execute(input, {
			columns: { flag: "boolean", active: "boolean", empty: "boolean" },
		});
		expect(result[0]!.get("flag")).toBe(false);
		expect(result[0]!.get("active")).toBe(true);
		expect(result[0]!.get("empty")).toBe(false);
	});

	it("coerces null to null regardless of target", async () => {
		const input = [new Row({ value: null })];
		const result = await coerce.execute(input, {
			columns: { value: "string" },
		});
		expect(result[0]!.get("value")).toBeNull();
	});

	it("preserves columns not in the coerce map", async () => {
		const result = await coerce.execute(rows, {
			columns: { id: "string" },
		});
		expect(result[0]!.get("name")).toBe("Alice");
		expect(result[0]!.get("age")).toBe(30);
	});

	it("preserves row id and metadata", async () => {
		const original = new Row(
			{ value: 1 },
			{ id: "test-id", metadata: { source: "test" } },
		);
		const result = await coerce.execute([original], {
			columns: { value: "string" },
		});
		expect(result[0]!.id).toBe("test-id");
		expect(result[0]!.metadata).toEqual({ source: "test" });
	});
});
