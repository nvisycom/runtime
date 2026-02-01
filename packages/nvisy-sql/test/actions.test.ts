import { describe, it, expect } from "vitest";
import { Row } from "@nvisy/core";
import type { ActionInstance } from "@nvisy/core";
import { filter } from "../src/actions/filter.js";
import { project } from "../src/actions/project.js";
import { rename } from "../src/actions/rename.js";
import { coerce } from "../src/actions/coerce.js";

/* ------------------------------------------------------------------ */
/*  shared fixtures                                                    */
/* ------------------------------------------------------------------ */

const rows = [
	new Row({ id: 1, name: "Alice", age: 30, city: "NYC" }),
	new Row({ id: 2, name: "Bob", age: 25, city: "LA" }),
	new Row({ id: 3, name: "Charlie", age: 35, city: "NYC" }),
	new Row({ id: 4, name: "Diana", age: null, city: "SF" }),
];

const rowWithIdentity = new Row(
	{ a: 1, b: 2 },
	{ id: "test-id", metadata: { source: "test" } },
);

async function expectPreservesIdentity(
	action: ActionInstance<Row, Row, any>,
	params: unknown,
) {
	const result = await action.execute([rowWithIdentity], params);
	expect(result[0]!.id).toBe("test-id");
	expect(result[0]!.metadata).toEqual({ source: "test" });
}

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

	it("excludes null values from numeric gt comparison", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "age", op: "gt", value: 0 }],
		});
		// Diana (age: null) is excluded because null is not a number
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.get("name") !== "Diana")).toBe(true);
	});

	it("treats non-existent column as undefined", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "nonexistent", op: "isNull" }],
		});
		// undefined is treated as null-like → all rows match
		expect(result).toHaveLength(4);
	});

	it("eq on non-existent column matches nothing (not equal to any value)", async () => {
		const result = await filter.execute(rows, {
			conditions: [{ column: "nonexistent", op: "eq", value: "anything" }],
		});
		expect(result).toHaveLength(0);
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

	it("preserves row id and metadata", async () => {
		await expectPreservesIdentity(filter, {
			conditions: [],
		});
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

	it("ignores missing columns in keep", async () => {
		const result = await project.execute(rows, {
			keep: ["id", "nonexistent"],
		});
		expect(Object.keys(result[0]!.columns)).toEqual(["id"]);
	});

	it("ignores missing columns in drop", async () => {
		const result = await project.execute(rows, {
			drop: ["nonexistent"],
		});
		// All original columns remain because "nonexistent" matched nothing
		expect(Object.keys(result[0]!.columns)).toEqual([
			"id",
			"name",
			"age",
			"city",
		]);
	});

	it("preserves row id and metadata", async () => {
		await expectPreservesIdentity(project, { keep: ["a"] });
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

	it("handles overlapping keys by processing entries in order", async () => {
		// Rename a→b and b→c. The implementation iterates original entries,
		// writing into a shared result object. When an unmapped key collides
		// with a rename target, last-write wins.
		const input = [new Row({ a: 1, b: 2, c: 3 })];
		const result = await rename.execute(input, {
			mapping: { a: "b", b: "c" },
		});
		// a=1 → writes result["b"]=1, b=2 → writes result["c"]=2,
		// c=3 (unmapped) → writes result["c"]=3 (overwrites b→c)
		expect(result[0]!.get("b")).toBe(1);
		expect(result[0]!.get("c")).toBe(3);
		expect(result[0]!.get("a")).toBeUndefined();
	});

	it("swaps keys when targets don't collide with unmapped columns", async () => {
		const input = [new Row({ x: 10, y: 20 })];
		const result = await rename.execute(input, {
			mapping: { x: "y", y: "x" },
		});
		// x=10 → result["y"]=10, y=20 → result["x"]=20
		expect(result[0]!.get("x")).toBe(20);
		expect(result[0]!.get("y")).toBe(10);
	});

	it("handles empty mapping (no-op)", async () => {
		const result = await rename.execute(rows, { mapping: {} });
		expect(result[0]!.columns).toEqual(rows[0]!.columns);
	});

	it("preserves row id and metadata", async () => {
		await expectPreservesIdentity(rename, { mapping: { a: "b" } });
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

	it("coerces missing column to null", async () => {
		const input = [new Row({ existing: 1 })];
		const result = await coerce.execute(input, {
			columns: { missing: "string" },
		});
		// undefined → null via coerceValue, column is created as null
		expect(result[0]!.get("missing")).toBeNull();
		// Original column untouched
		expect(result[0]!.get("existing")).toBe(1);
	});

	it("preserves columns not in the coerce map", async () => {
		const result = await coerce.execute(rows, {
			columns: { id: "string" },
		});
		expect(result[0]!.get("name")).toBe("Alice");
		expect(result[0]!.get("age")).toBe(30);
	});

	it("preserves row id and metadata", async () => {
		await expectPreservesIdentity(coerce, { columns: { a: "string" } });
	});
});
