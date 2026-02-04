import { describe, expect, it } from "vitest";
import type {
	DocumentPage,
	DocumentSection,
} from "../src/datatypes/document-datatype.js";
import { Document } from "../src/datatypes/document-datatype.js";

describe("Document", () => {
	it("basic backward compat: new Document('text') works without pages", () => {
		const doc = new Document("hello world");
		expect(doc.content).toBe("hello world");
		expect(doc.pages).toBeUndefined();
		expect(doc.flatElements).toEqual([]);
	});

	it("constructor accepts pages in options", () => {
		const pages: DocumentPage[] = [
			{
				pageNumber: 1,
				sections: [
					{
						title: "Intro",
						elements: [{ type: "paragraph", text: "Hello" }],
					},
				],
			},
		];
		const doc = new Document("Hello", { pages });
		expect(doc.content).toBe("Hello");
		expect(doc.pages).toEqual(pages);
	});

	describe("Document.fromPages()", () => {
		it("derives content from element texts joined with \\n\\n", () => {
			const pages: DocumentPage[] = [
				{
					pageNumber: 1,
					sections: [
						{
							elements: [
								{ type: "heading", text: "Title", level: 1 },
								{ type: "paragraph", text: "First paragraph." },
							],
						},
					],
				},
				{
					pageNumber: 2,
					sections: [
						{
							elements: [{ type: "paragraph", text: "Second page content." }],
						},
					],
				},
			];

			const doc = Document.fromPages(pages);
			expect(doc.content).toBe(
				"Title\n\nFirst paragraph.\n\nSecond page content.",
			);
			expect(doc.pages).toEqual(pages);
		});

		it("produces empty content from empty pages array", () => {
			const doc = Document.fromPages([]);
			expect(doc.content).toBe("");
			expect(doc.pages).toEqual([]);
		});

		it("preserves sourceType and metadata through fromPages()", () => {
			const pages: DocumentPage[] = [
				{
					pageNumber: 1,
					sections: [
						{
							elements: [{ type: "paragraph", text: "text" }],
						},
					],
				},
			];
			const doc = Document.fromPages(pages, {
				sourceType: "pdf",
				metadata: { key: "value" },
			});
			expect(doc.sourceType).toBe("pdf");
			expect(doc.metadata).toEqual({ key: "value" });
			expect(doc.pages).toHaveLength(1);
		});
	});

	describe("flatElements", () => {
		it("traverses pages → sections recursively in document order", () => {
			const pages: DocumentPage[] = [
				{
					pageNumber: 1,
					sections: [
						{
							title: "S1",
							elements: [
								{ type: "heading", text: "H1", level: 1 },
								{ type: "paragraph", text: "P1" },
							],
							children: [
								{
									title: "S1.1",
									elements: [{ type: "paragraph", text: "P1.1" }],
								},
							],
						},
					],
				},
				{
					pageNumber: 2,
					sections: [
						{
							elements: [{ type: "table", text: "T1" }],
						},
					],
				},
			];

			const doc = new Document("ignored", { pages });
			const flat = doc.flatElements;
			expect(flat.map((e) => e.text)).toEqual(["H1", "P1", "P1.1", "T1"]);
		});

		it("handles deeply nested sections (3+ levels)", () => {
			const deepSection: DocumentSection = {
				title: "L1",
				elements: [{ type: "paragraph", text: "Level 1" }],
				children: [
					{
						title: "L2",
						elements: [{ type: "paragraph", text: "Level 2" }],
						children: [
							{
								title: "L3",
								elements: [{ type: "paragraph", text: "Level 3" }],
								children: [
									{
										title: "L4",
										elements: [{ type: "code", text: "Level 4" }],
									},
								],
							},
						],
					},
				],
			};
			const pages: DocumentPage[] = [
				{ pageNumber: 1, sections: [deepSection] },
			];
			const doc = new Document("x", { pages });
			expect(doc.flatElements.map((e) => e.text)).toEqual([
				"Level 1",
				"Level 2",
				"Level 3",
				"Level 4",
			]);
		});

		it("handles sections without titles", () => {
			const pages: DocumentPage[] = [
				{
					pageNumber: 1,
					sections: [
						{
							elements: [{ type: "paragraph", text: "No title section" }],
						},
					],
				},
			];
			const doc = new Document("x", { pages });
			expect(doc.flatElements).toHaveLength(1);
			expect(doc.flatElements[0]!.text).toBe("No title section");
		});

		it("includes elements with empty text strings", () => {
			const pages: DocumentPage[] = [
				{
					pageNumber: 1,
					sections: [
						{
							elements: [
								{ type: "image", text: "" },
								{ type: "paragraph", text: "after" },
							],
						},
					],
				},
			];
			const doc = new Document("x", { pages });
			expect(doc.flatElements).toHaveLength(2);
			expect(doc.flatElements[0]!.text).toBe("");
			expect(doc.flatElements[0]!.type).toBe("image");
		});
	});
});
