import { describe, expect, it } from "vitest";
import { Data } from "./data.js";

class TestData extends Data {}

describe("Data", () => {
	it("auto-generates a UUID id", () => {
		const a = new TestData();
		const b = new TestData();
		expect(a.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(a.id).not.toBe(b.id);
	});

	it("defaults: parentId is null, metadata is null, isDerived is false", () => {
		const data = new TestData();
		expect(data.parentId).toBeNull();
		expect(data.metadata).toBeNull();
		expect(data.isDerived).toBe(false);
	});

	describe("deriveFrom", () => {
		it("copies parentId and metadata from parent", () => {
			const parent = new TestData().withMetadata({ key: "value" });
			const child = new TestData().deriveFrom(parent);
			expect(child.parentId).toBe(parent.id);
			expect(child.metadata).toEqual({ key: "value" });
			expect(child.isDerived).toBe(true);
		});

		it("copies null metadata from parent", () => {
			const parent = new TestData();
			const child = new TestData().deriveFrom(parent);
			expect(child.parentId).toBe(parent.id);
			expect(child.metadata).toBeNull();
		});

		it("returns this for chaining", () => {
			const parent = new TestData();
			const child = new TestData();
			expect(child.deriveFrom(parent)).toBe(child);
		});
	});

	describe("withParent", () => {
		it("sets parentId", () => {
			const data = new TestData().withParent("parent-123");
			expect(data.parentId).toBe("parent-123");
			expect(data.isDerived).toBe(true);
		});

		it("accepts null to clear", () => {
			const data = new TestData().withParent("p-1").withParent(null);
			expect(data.parentId).toBeNull();
			expect(data.isDerived).toBe(false);
		});

		it("returns this for chaining", () => {
			const data = new TestData();
			expect(data.withParent("x")).toBe(data);
		});
	});

	describe("withMetadata", () => {
		it("sets metadata", () => {
			const data = new TestData().withMetadata({ key: "value" });
			expect(data.metadata).toEqual({ key: "value" });
		});

		it("accepts null to clear", () => {
			const data = new TestData().withMetadata({ a: 1 }).withMetadata(null);
			expect(data.metadata).toBeNull();
		});

		it("returns this for chaining", () => {
			const data = new TestData();
			expect(data.withMetadata({ a: 1 })).toBe(data);
		});
	});

	it("deriveFrom then withMetadata overrides metadata", () => {
		const parent = new TestData().withMetadata({ old: 1 });
		const child = new TestData().deriveFrom(parent).withMetadata({ new: 2 });
		expect(child.parentId).toBe(parent.id);
		expect(child.metadata).toEqual({ new: 2 });
	});
});
