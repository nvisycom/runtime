import { describe, expect, it } from "vitest";
import { Document } from "../datatypes/index.js";
import { chunkByPage } from "./chunk-by-page.js";

describe("chunkByPage", () => {
	it("splits on form feed markers", () => {
		const doc = new Document("Page 1\fPage 2\fPage 3");
		const chunks = [...chunkByPage(doc, {})];
		expect(chunks).toHaveLength(3);
		expect(chunks[0]!.content).toBe("Page 1");
		expect(chunks[1]!.content).toBe("Page 2");
		expect(chunks[2]!.content).toBe("Page 3");
	});

	describe("maxCharacters", () => {
		it("splits long pages into smaller chunks", () => {
			const longPage = "a".repeat(100);
			const doc = new Document(`${longPage}\f${"b".repeat(20)}`);
			const chunks = [...chunkByPage(doc, { maxCharacters: 30 })];
			for (const chunk of chunks) {
				expect(chunk.content.length).toBeLessThanOrEqual(30);
			}
			// 100 chars / 30 = 4 pieces + 1 short page = 5
			expect(chunks).toHaveLength(5);
		});

		it("leaves short pages intact", () => {
			const doc = new Document("Page 1\fPage 2");
			const chunks = [...chunkByPage(doc, { maxCharacters: 1000 })];
			expect(chunks).toHaveLength(2);
			expect(chunks[0]!.content).toBe("Page 1");
			expect(chunks[1]!.content).toBe("Page 2");
		});

		it("updates chunkIndex and chunkTotal after splitting", () => {
			const doc = new Document("a".repeat(50));
			const chunks = [...chunkByPage(doc, { maxCharacters: 20 })];
			for (let i = 0; i < chunks.length; i++) {
				expect(chunks[i]!.chunkIndex).toBe(i);
				expect(chunks[i]!.chunkTotal).toBe(chunks.length);
			}
		});
	});

	it("derives all chunks from the source document", () => {
		const doc = new Document("Page 1\fPage 2");
		const chunks = [...chunkByPage(doc, {})];
		for (const chunk of chunks) {
			expect(chunk.parentId).toBe(doc.id);
		}
	});
});
