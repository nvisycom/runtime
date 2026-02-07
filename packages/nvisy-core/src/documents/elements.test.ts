import { describe, expect, it } from "vitest";
import {
	CompositeElement,
	Element,
	EmailElement,
	FormElement,
	ImageElement,
	TableElement,
} from "./elements.js";

describe("Element", () => {
	it("auto-generates a unique id", () => {
		const a = new Element({ type: "title", text: "a" });
		const b = new Element({ type: "title", text: "b" });
		expect(a.id).toBeTruthy();
		expect(b.id).toBeTruthy();
		expect(a.id).not.toBe(b.id);
	});

	it("assigns type and text from options", () => {
		const el = new Element({ type: "narrative-text", text: "Hello world" });
		expect(el.type).toBe("narrative-text");
		expect(el.text).toBe("Hello world");
	});

	it("carries all base fields", () => {
		const el = new Element({
			type: "title",
			text: "Intro",
			parentId: "parent-1",
			pageNumber: 2,
			level: 1,
			languages: ["en"],
			metadata: { key: "value" },
		});
		expect(el.parentId).toBe("parent-1");
		expect(el.pageNumber).toBe(2);
		expect(el.level).toBe(1);
		expect(el.languages).toEqual(["en"]);
		expect(el.metadata).toEqual({ key: "value" });
	});

	it("all optional fields default to undefined", () => {
		const el = new Element({ type: "title", text: "" });
		expect(el.parentId).toBeUndefined();
		expect(el.pageNumber).toBeUndefined();
		expect(el.pageName).toBeUndefined();
		expect(el.level).toBeUndefined();
		expect(el.languages).toBeUndefined();
		expect(el.metadata).toBeUndefined();
		expect(el.sourceTag).toBeUndefined();
		expect(el.textAsHtml).toBeUndefined();
		expect(el.links).toBeUndefined();
		expect(el.emphasizedTexts).toBeUndefined();
		expect(el.provenance).toBeUndefined();
	});

	describe("links and emphasizedTexts", () => {
		it("carries links with startIndex", () => {
			const el = new Element({
				type: "narrative-text",
				text: "Visit example.com for details.",
				links: [
					{ text: "example.com", url: "https://example.com", startIndex: 6 },
				],
			});
			expect(el.links).toHaveLength(1);
			expect(el.links![0].startIndex).toBe(6);
			expect(el.links![0].url).toBe("https://example.com");
		});

		it("carries emphasizedTexts", () => {
			const el = new Element({
				type: "title",
				text: "Important notice",
				emphasizedTexts: [{ text: "Important", tag: "strong" }],
			});
			expect(el.emphasizedTexts).toHaveLength(1);
			expect(el.emphasizedTexts![0].tag).toBe("strong");
		});

		it("available on any element type, not just text", () => {
			const el = new TableElement({
				type: "table",
				text: "A table with links",
				links: [{ text: "link", url: "https://example.com", startIndex: 0 }],
				emphasizedTexts: [{ text: "table", tag: "b" }],
			});
			expect(el.links).toHaveLength(1);
			expect(el.emphasizedTexts).toHaveLength(1);
		});
	});

	describe("table fields", () => {
		it("carries cells with row, column, isHeader", () => {
			const el = new TableElement({
				type: "table",
				text: "",
				cells: [
					{ row: 0, column: 0, text: "Name", isHeader: true },
					{ row: 0, column: 1, text: "Age", isHeader: true },
					{ row: 1, column: 0, text: "Alice" },
					{ row: 1, column: 1, text: "30" },
				],
			});
			expect(el).toBeInstanceOf(Element);
			expect(el.cells).toHaveLength(4);
			expect(el.cells![0].isHeader).toBe(true);
			expect(el.cells![2].text).toBe("Alice");
		});

		it("cells defaults to undefined", () => {
			const el = new TableElement({ type: "table", text: "" });
			expect(el.cells).toBeUndefined();
		});
	});

	describe("image fields", () => {
		it("carries imageBase64, imageMimeType, imageUrl, imagePath", () => {
			const el = new ImageElement({
				type: "image",
				text: "A photo",
				imageBase64: "abc123==",
				imageMimeType: "image/png",
				imageUrl: "https://example.com/photo.png",
				imagePath: "/tmp/photo.png",
			});
			expect(el.imageBase64).toBe("abc123==");
			expect(el.imageMimeType).toBe("image/png");
			expect(el.imageUrl).toBe("https://example.com/photo.png");
			expect(el.imagePath).toBe("/tmp/photo.png");
		});

		it("is an instance of Element", () => {
			const el = new ImageElement({ type: "image", text: "photo" });
			expect(el).toBeInstanceOf(Element);
			expect(el).toBeInstanceOf(ImageElement);
		});

		it("image fields default to undefined", () => {
			const el = new ImageElement({ type: "image", text: "" });
			expect(el.imageBase64).toBeUndefined();
			expect(el.imageMimeType).toBeUndefined();
			expect(el.imageUrl).toBeUndefined();
			expect(el.imagePath).toBeUndefined();
		});

		it("image fields only live on ImageElement", () => {
			const base = new Element({ type: "image", text: "" });
			expect("imageBase64" in base).toBe(false);
			expect("imageMimeType" in base).toBe(false);
			expect("imageUrl" in base).toBe(false);
			expect("imagePath" in base).toBe(false);
		});
	});

	describe("form fields", () => {
		it("carries checked and value", () => {
			const el = new FormElement({
				type: "checkbox",
				text: "Accept terms",
				checked: true,
				value: "yes",
			});
			expect(el).toBeInstanceOf(Element);
			expect(el.checked).toBe(true);
			expect(el.value).toBe("yes");
		});

		it("checked and value default to undefined", () => {
			const el = new FormElement({ type: "checkbox", text: "" });
			expect(el.checked).toBeUndefined();
			expect(el.value).toBeUndefined();
		});
	});

	describe("email fields", () => {
		it("carries all email envelope fields", () => {
			const el = new EmailElement({
				type: "email-message",
				text: "Hello from email",
				sentFrom: ["alice@example.com"],
				sentTo: ["bob@example.com"],
				ccRecipient: ["carol@example.com"],
				bccRecipient: ["dave@example.com"],
				subject: "Meeting notes",
				signature: "— Alice",
				emailMessageId: "<msg-001@example.com>",
			});
			expect(el).toBeInstanceOf(Element);
			expect(el.sentFrom).toEqual(["alice@example.com"]);
			expect(el.sentTo).toEqual(["bob@example.com"]);
			expect(el.ccRecipient).toEqual(["carol@example.com"]);
			expect(el.bccRecipient).toEqual(["dave@example.com"]);
			expect(el.subject).toBe("Meeting notes");
			expect(el.signature).toBe("— Alice");
			expect(el.emailMessageId).toBe("<msg-001@example.com>");
		});

		it("email fields default to undefined", () => {
			const el = new EmailElement({ type: "email-message", text: "" });
			expect(el.sentFrom).toBeUndefined();
			expect(el.sentTo).toBeUndefined();
			expect(el.ccRecipient).toBeUndefined();
			expect(el.bccRecipient).toBeUndefined();
			expect(el.subject).toBeUndefined();
			expect(el.signature).toBeUndefined();
			expect(el.emailMessageId).toBeUndefined();
		});
	});

	describe("provenance fields", () => {
		it("carries detectionOrigin via provenance", () => {
			const el = new Element({
				type: "title",
				text: "Hello",
				provenance: { detectionOrigin: "tesseract-v5" },
			});
			expect(el.provenance?.detectionOrigin).toBe("tesseract-v5");
		});

		it("carries headerFooterType via provenance", () => {
			const el = new Element({
				type: "header",
				text: "Page 1",
				provenance: { headerFooterType: "page-header" },
			});
			expect(el.provenance?.headerFooterType).toBe("page-header");
		});
	});

	describe("source fidelity fields", () => {
		it("carries sourceTag for format-specific origin", () => {
			const el = new Element({
				type: "narrative-text",
				text: "To be or not to be",
				sourceTag: "blockquote",
			});
			expect(el.sourceTag).toBe("blockquote");
		});

		it("carries textAsHtml on base Element", () => {
			const el = new Element({
				type: "narrative-text",
				text: "bold text",
				textAsHtml: "<p><strong>bold</strong> text</p>",
			});
			expect(el.textAsHtml).toBe("<p><strong>bold</strong> text</p>");
		});

		it("carries textAsHtml on TableElement", () => {
			const el = new TableElement({
				type: "table",
				text: "Name\tAge\nAlice\t30",
				textAsHtml: "<table><tr><td>Name</td><td>Age</td></tr></table>",
			});
			expect(el.textAsHtml).toBe(
				"<table><tr><td>Name</td><td>Age</td></tr></table>",
			);
		});

		it("carries pageName for worksheet-based sources", () => {
			const el = new Element({
				type: "table",
				text: "data",
				pageName: "Sheet1",
			});
			expect(el.pageName).toBe("Sheet1");
		});
	});

	describe("form keyValuePairs", () => {
		it("carries structured key-value pairs", () => {
			const el = new FormElement({
				type: "form-keys-values",
				text: "Name: Alice",
				keyValuePairs: [
					{ key: "Name", value: "Alice", confidence: 0.99 },
					{ key: "Age", value: "30" },
				],
			});
			expect(el.keyValuePairs).toHaveLength(2);
			expect(el.keyValuePairs![0].key).toBe("Name");
			expect(el.keyValuePairs![0].value).toBe("Alice");
			expect(el.keyValuePairs![0].confidence).toBe(0.99);
			expect(el.keyValuePairs![1].confidence).toBeUndefined();
		});

		it("keyValuePairs defaults to undefined", () => {
			const el = new FormElement({ type: "form-keys-values", text: "" });
			expect(el.keyValuePairs).toBeUndefined();
		});
	});

	describe("composite fields", () => {
		it("carries origElements", () => {
			const orig1 = new Element({ type: "narrative-text", text: "Part 1" });
			const orig2 = new Element({ type: "narrative-text", text: "Part 2" });
			const composite = new CompositeElement({
				type: "narrative-text",
				text: "Part 1 Part 2",
				origElements: [orig1, orig2],
			});
			expect(composite).toBeInstanceOf(Element);
			expect(composite.origElements).toHaveLength(2);
			expect(composite.origElements[0].text).toBe("Part 1");
			expect(composite.origElements[1].text).toBe("Part 2");
		});
	});
});
