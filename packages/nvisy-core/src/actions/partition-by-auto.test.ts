import { describe, expect, it } from "vitest";
import { Document } from "../datatypes/index.js";
import { partitionByAuto } from "./partition-by-auto.js";

describe("partitionByAuto", () => {
	it("returns document content as a single-element array", () => {
		const doc = new Document("Hello, world!");
		const parts = partitionByAuto(doc, {});
		expect(parts).toEqual(["Hello, world!"]);
	});

	it("preserves full content without modification", () => {
		const content = "Line 1\nLine 2\n\nParagraph 2";
		const doc = new Document(content);
		const parts = partitionByAuto(doc, {});
		expect(parts).toEqual([content]);
	});

	it("handles empty content", () => {
		const doc = new Document("");
		const parts = partitionByAuto(doc, {});
		expect(parts).toEqual([""]);
	});
});
