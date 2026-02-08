import { describe, expect, it } from "vitest";
import { Embedding } from "./embedding.js";

describe("Embedding", () => {
	it("constructs from a number array", () => {
		const e = new Embedding([0.1, -0.2, 0.3]);
		expect(e.dimensions).toBe(3);
		expect(e.vector).toBeInstanceOf(Float32Array);
	});

	it("constructs from a Float32Array", () => {
		const arr = new Float32Array([1.0, 2.0]);
		const e = new Embedding(arr);
		expect(e.dimensions).toBe(2);
		expect(e.vector).toBe(arr);
	});

	it("preserves approximate values from number array", () => {
		const e = new Embedding([0.5, -0.5]);
		expect(e.vector[0]).toBeCloseTo(0.5);
		expect(e.vector[1]).toBeCloseTo(-0.5);
	});

	it("handles zero-length vector", () => {
		const e = new Embedding([]);
		expect(e.dimensions).toBe(0);
		expect(e.vector).toHaveLength(0);
	});

	it("has a unique id", () => {
		const a = new Embedding([1]);
		const b = new Embedding([1]);
		expect(a.id).not.toBe(b.id);
	});

	it("supports lineage via deriveFrom", () => {
		const parent = new Embedding([1, 2]);
		const child = new Embedding([3, 4]);
		child.deriveFrom(parent);

		expect(child.parentId).toBe(parent.id);
		expect(child.isDerived).toBe(true);
	});

	it("supports metadata", () => {
		const e = new Embedding([0.1]);
		e.withMetadata({ model: "text-embedding-3-small" });
		expect(e.metadata).toEqual({ model: "text-embedding-3-small" });
	});
});
