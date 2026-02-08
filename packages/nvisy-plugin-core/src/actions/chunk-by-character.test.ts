import { Document } from "@nvisy/core";
import { describe, expect, it } from "vitest";
import { chunkByCharacter } from "./chunk-by-character.js";

describe("chunkByCharacter", () => {
	it("splits text into chunks of maxCharacters", () => {
		const doc = new Document("abcdefghij");
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 3,
				overlap: 0,
			}),
		];
		expect(chunks).toHaveLength(4);
		expect(chunks[0]!.content).toBe("abc");
		expect(chunks[1]!.content).toBe("def");
		expect(chunks[2]!.content).toBe("ghi");
		expect(chunks[3]!.content).toBe("j");
	});

	it("applies overlap between chunks", () => {
		const doc = new Document("abcdefghij");
		// maxCharacters=5, overlap=2 → step=3, starts at 0, 3, 6, 9
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 5,
				overlap: 2,
			}),
		];
		expect(chunks[0]!.content).toBe("abcde");
		expect(chunks[1]!.content).toBe("defgh");
		expect(chunks[2]!.content).toBe("ghij");
	});

	it("yields nothing when step is zero", () => {
		const doc = new Document("hello");
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 3,
				overlap: 3,
			}),
		];
		expect(chunks).toHaveLength(0);
	});

	it("sets chunkIndex and chunkTotal on each chunk", () => {
		const doc = new Document("abcdef");
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 2,
				overlap: 0,
			}),
		];
		expect(chunks).toHaveLength(3);
		for (let i = 0; i < chunks.length; i++) {
			expect(chunks[i]!.chunkIndex).toBe(i);
			expect(chunks[i]!.chunkTotal).toBe(3);
		}
	});

	it("derives chunks from the source document", () => {
		const doc = new Document("abcdef");
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 3,
				overlap: 0,
			}),
		];
		for (const chunk of chunks) {
			expect(chunk.parentId).toBe(doc.id);
		}
	});

	it("returns single chunk when text fits in maxCharacters", () => {
		const doc = new Document("abc");
		const chunks = [
			...chunkByCharacter(doc, {
				maxCharacters: 10,
				overlap: 0,
			}),
		];
		expect(chunks).toHaveLength(1);
		expect(chunks[0]!.content).toBe("abc");
	});
});
