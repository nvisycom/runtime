import { describe, expect, it } from "vitest";
import { Chunk } from "./chunk.js";

describe("Chunk", () => {
	it("stores content", () => {
		const chunk = new Chunk("Hello, world!");
		expect(chunk.content).toBe("Hello, world!");
	});

	it("defaults chunkIndex and chunkTotal to undefined", () => {
		const chunk = new Chunk("text");
		expect(chunk.chunkIndex).toBeUndefined();
		expect(chunk.chunkTotal).toBeUndefined();
	});

	it("accepts chunkIndex and chunkTotal via options", () => {
		const chunk = new Chunk("text", { chunkIndex: 2, chunkTotal: 10 });
		expect(chunk.chunkIndex).toBe(2);
		expect(chunk.chunkTotal).toBe(10);
	});

	it("accepts partial options", () => {
		const indexOnly = new Chunk("a", { chunkIndex: 0 });
		expect(indexOnly.chunkIndex).toBe(0);
		expect(indexOnly.chunkTotal).toBeUndefined();

		const totalOnly = new Chunk("b", { chunkTotal: 5 });
		expect(totalOnly.chunkIndex).toBeUndefined();
		expect(totalOnly.chunkTotal).toBe(5);
	});

	it("handles empty content", () => {
		const chunk = new Chunk("");
		expect(chunk.content).toBe("");
	});

	it("extends Data and has id, parentId, metadata", () => {
		const chunk = new Chunk("content");
		expect(chunk.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(chunk.parentId).toBeNull();
		expect(chunk.metadata).toBeNull();
	});

	it("has a unique id per instance", () => {
		const a = new Chunk("same");
		const b = new Chunk("same");
		expect(a.id).not.toBe(b.id);
	});

	it("supports deriveFrom for lineage", () => {
		const parent = new Chunk("parent text");
		const child = new Chunk("child text").deriveFrom(parent);
		expect(child.parentId).toBe(parent.id);
		expect(child.isDerived).toBe(true);
	});

	it("deriveFrom copies metadata from parent", () => {
		const parent = new Chunk("parent").withMetadata({ source: "pdf" });
		const child = new Chunk("child").deriveFrom(parent);
		expect(child.metadata).toEqual({ source: "pdf" });
	});

	it("supports withMetadata", () => {
		const chunk = new Chunk("text").withMetadata({
			page: 3,
			section: "intro",
		});
		expect(chunk.metadata).toEqual({ page: 3, section: "intro" });
	});

	it("supports withParent", () => {
		const chunk = new Chunk("text").withParent("custom-parent-id");
		expect(chunk.parentId).toBe("custom-parent-id");
	});
});
