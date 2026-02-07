import { describe, expect, it } from "vitest";
import { Document } from "../datatypes/index.js";
import { chunkBySection } from "./chunk-by-section.js";

describe("chunkBySection", () => {
	const markdown = [
		"Intro text",
		"## Section A",
		"Content A is here",
		"## Section B",
		"Content B is here",
		"## Section C",
		"Content C is short",
	].join("\n");

	it("splits on heading level", () => {
		const doc = new Document(markdown);
		const chunks = [...chunkBySection(doc, { level: 2 })];
		expect(chunks).toHaveLength(4);
		expect(chunks[0]!.content).toBe("Intro text");
		expect(chunks[1]!.content).toContain("Section A");
		expect(chunks[2]!.content).toContain("Section B");
		expect(chunks[3]!.content).toContain("Section C");
	});

	describe("maxCharacters", () => {
		it("splits long sections into smaller chunks", () => {
			const longContent = `## Title\n${"x".repeat(100)}`;
			const doc = new Document(longContent);
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					maxCharacters: 30,
				}),
			];
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(30);
			}
			expect(chunks.length).toBeGreaterThan(1);
		});

		it("leaves short sections intact", () => {
			const doc = new Document("## Short\nHello");
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					maxCharacters: 1000,
				}),
			];
			expect(chunks).toHaveLength(1);
			expect(chunks[0]!.content).toContain("Hello");
		});

		it("updates chunkIndex and chunkTotal after splitting", () => {
			const longContent = `## Title\n${"a".repeat(50)}`;
			const doc = new Document(longContent);
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					maxCharacters: 20,
				}),
			];
			for (let i = 0; i < chunks.length; i++) {
				expect(chunks[i]!.chunkIndex).toBe(i);
				expect(chunks[i]!.chunkTotal).toBe(chunks.length);
			}
		});
	});

	describe("combineUnder", () => {
		it("merges consecutive short sections", () => {
			const short = "## A\naa\n## B\nbb\n## C\ncc";
			const doc = new Document(short);
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					combineUnder: 200,
				}),
			];
			expect(chunks).toHaveLength(1);
			expect(chunks[0]!.content).toContain("## A");
			expect(chunks[0]!.content).toContain("## C");
		});

		it("does not merge sections that exceed threshold", () => {
			const sections = [
				"## A",
				"a".repeat(50),
				"## B",
				"b".repeat(50),
				"## C",
				"c".repeat(50),
			].join("\n");
			const doc = new Document(sections);
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					combineUnder: 30,
				}),
			];
			expect(chunks).toHaveLength(3);
		});

		it("combines then splits with both options", () => {
			const sections = "## A\naa\n## B\nbb\n## C\ncc";
			const doc = new Document(sections);
			// Combine first (all short), then split result
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					combineUnder: 500,
					maxCharacters: 10,
				}),
			];
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(10);
			}
		});

		it("keeps long sections separate", () => {
			const sections = ["## Short", "hi", "## Long", "x".repeat(200)].join(
				"\n",
			);
			const doc = new Document(sections);
			const chunks = [
				...chunkBySection(doc, {
					level: 2,
					combineUnder: 50,
				}),
			];
			expect(chunks.length).toBeGreaterThanOrEqual(2);
		});
	});

	it("derives all chunks from the source document", () => {
		const doc = new Document(markdown);
		const chunks = [...chunkBySection(doc, { level: 2 })];
		for (const chunk of chunks) {
			expect(chunk.parentId).toBe(doc.id);
		}
	});
});
