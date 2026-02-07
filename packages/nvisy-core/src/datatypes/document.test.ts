import { describe, expect, it } from "vitest";
import { Element } from "../documents/elements.js";
import { Document } from "./document.js";

describe("Document", () => {
	it("stores content and has no elements by default", () => {
		const doc = new Document("hello world");
		expect(doc.content).toBe("hello world");
		expect(doc.elements).toBeUndefined();
	});

	it("constructor accepts elements in options", () => {
		const el = new Element({
			type: "narrative-text",
			text: "Hello",
		});
		const doc = new Document("Hello", { elements: [el] });
		expect(doc.content).toBe("Hello");
		expect(doc.elements).toHaveLength(1);
		expect(doc.elements![0]!.text).toBe("Hello");
	});

	describe("title", () => {
		it("is undefined by default", () => {
			const doc = new Document("text");
			expect(doc.title).toBeUndefined();
		});

		it("is set via constructor options", () => {
			const doc = new Document("text", { title: "Quarterly Report" });
			expect(doc.title).toBe("Quarterly Report");
		});

		it("is preserved by fromElements", () => {
			const el = new Element({
				type: "narrative-text",
				text: "hi",
			});
			const doc = Document.fromElements([el], {
				sourceType: "html",
				title: "My Page",
			});
			expect(doc.title).toBe("My Page");
			expect(doc.sourceType).toBe("html");
		});
	});

	describe("languages", () => {
		it("is empty when there are no elements", () => {
			const doc = new Document("text");
			expect(doc.languages).toEqual([]);
		});

		it("is empty when no elements have languages", () => {
			const doc = new Document("text", {
				elements: [
					new Element({
						type: "narrative-text",
						text: "hello",
					}),
				],
			});
			expect(doc.languages).toEqual([]);
		});

		it("collects unique languages from all elements", () => {
			const doc = new Document("text", {
				elements: [
					new Element({
						type: "narrative-text",
						text: "hello",
						languages: ["en"],
					}),
					new Element({
						type: "narrative-text",
						text: "hallo",
						languages: ["de", "en"],
					}),
					new Element({
						type: "narrative-text",
						text: "bonjour",
						languages: ["fr"],
					}),
				],
			});
			expect(doc.languages).toEqual(["en", "de", "fr"]);
		});

		it("skips elements without languages", () => {
			const doc = new Document("text", {
				elements: [
					new Element({
						type: "narrative-text",
						text: "no lang",
					}),
					new Element({
						type: "narrative-text",
						text: "has lang",
						languages: ["es"],
					}),
				],
			});
			expect(doc.languages).toEqual(["es"]);
		});
	});

	describe("fromElements", () => {
		it("derives content from element texts joined with \\n\\n", () => {
			const elements = [
				new Element({
					type: "title",
					text: "Title",
					level: 1,
				}),
				new Element({
					type: "narrative-text",
					text: "First paragraph.",
				}),
				new Element({
					type: "narrative-text",
					text: "Second paragraph.",
				}),
			];
			const doc = Document.fromElements(elements);
			expect(doc.content).toBe(
				"Title\n\nFirst paragraph.\n\nSecond paragraph.",
			);
			expect(doc.elements).toHaveLength(3);
		});

		it("produces empty content from empty elements array", () => {
			const doc = Document.fromElements([]);
			expect(doc.content).toBe("");
			expect(doc.elements).toEqual([]);
		});

		it("preserves sourceType", () => {
			const el = new Element({
				type: "narrative-text",
				text: "text",
			});
			const doc = Document.fromElements([el], { sourceType: "pdf" });
			expect(doc.sourceType).toBe("pdf");
			expect(doc.elements).toHaveLength(1);
		});
	});

	describe("Element", () => {
		it("auto-generates a unique id", () => {
			const a = new Element({
				type: "narrative-text",
				text: "a",
			});
			const b = new Element({
				type: "narrative-text",
				text: "b",
			});
			expect(a.id).toBeTruthy();
			expect(b.id).toBeTruthy();
			expect(a.id).not.toBe(b.id);
		});

		it("carries parentId for hierarchy", () => {
			const table = new Element({ type: "table", text: "" });
			const child = new Element({
				type: "narrative-text",
				text: "Revenue",
				parentId: table.id,
			});
			expect(child.parentId).toBe(table.id);
		});

		it("carries pageNumber", () => {
			const el = new Element({
				type: "title",
				text: "Intro",
				pageNumber: 2,
			});
			expect(el.pageNumber).toBe(2);
		});

		it("carries optional enrichment fields", () => {
			const el = new Element({
				type: "table",
				text: "A | B",
				languages: ["en"],
				provenance: { confidence: 0.95, isContinuation: false },
			});
			expect(el.provenance?.confidence).toBe(0.95);
			expect(el.languages).toEqual(["en"]);
			expect(el.provenance?.isContinuation).toBe(false);
		});

		it("accepts various element types", () => {
			const elements = [
				new Element({ type: "formula", text: "E = mc²" }),
				new Element({ type: "list-item", text: "First item" }),
				new Element({ type: "page-break", text: "" }),
			];
			expect(elements.map((e) => e.type)).toEqual([
				"formula",
				"list-item",
				"page-break",
			]);
		});
	});
});
