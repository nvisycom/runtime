import { describe, expect, it } from "vitest";
import {
	CodeType,
	categoryOf,
	ElementType,
	EmailType,
	FormType,
	LayoutType,
	MathType,
	MediaType,
	ontology,
	TableType,
	TextType,
} from "./ontology.js";

describe("per-category const objects", () => {
	it("TextType has 8 entries", () => {
		expect(Object.values(TextType)).toHaveLength(8);
		expect(TextType.Title).toBe("title");
		expect(TextType.NarrativeText).toBe("narrative-text");
		expect(TextType.ListItem).toBe("list-item");
		expect(TextType.Header).toBe("header");
		expect(TextType.Footer).toBe("footer");
		expect(TextType.FigureCaption).toBe("figure-caption");
		expect(TextType.Address).toBe("address");
		expect(TextType.UncategorizedText).toBe("uncategorized-text");
	});

	it("TableType has 1 entry", () => {
		expect(Object.values(TableType)).toEqual(["table"]);
	});

	it("MediaType has 1 entry", () => {
		expect(Object.values(MediaType)).toEqual(["image"]);
	});

	it("CodeType has 1 entry", () => {
		expect(Object.values(CodeType)).toEqual(["code-snippet"]);
	});

	it("MathType has 1 entry", () => {
		expect(Object.values(MathType)).toEqual(["formula"]);
	});

	it("FormType has 2 entries", () => {
		expect(Object.values(FormType)).toHaveLength(2);
		expect(FormType.CheckBox).toBe("checkbox");
		expect(FormType.FormKeysValues).toBe("form-keys-values");
	});

	it("LayoutType has 2 entries", () => {
		expect(Object.values(LayoutType)).toHaveLength(2);
		expect(LayoutType.PageBreak).toBe("page-break");
		expect(LayoutType.PageNumber).toBe("page-number");
	});

	it("EmailType has 1 entry", () => {
		expect(Object.values(EmailType)).toEqual(["email-message"]);
	});
});

describe("ElementType", () => {
	it("has all 17 values", () => {
		const allValues = Object.values(ElementType);
		expect(allValues).toHaveLength(17);
	});

	it("includes values from every category", () => {
		expect(ElementType.Title).toBe("title");
		expect(ElementType.Table).toBe("table");
		expect(ElementType.Image).toBe("image");
		expect(ElementType.CodeSnippet).toBe("code-snippet");
		expect(ElementType.Formula).toBe("formula");
		expect(ElementType.CheckBox).toBe("checkbox");
		expect(ElementType.PageBreak).toBe("page-break");
	});
});

describe("ontology", () => {
	it("maps every category to a non-empty array", () => {
		for (const [category, types] of Object.entries(ontology)) {
			expect(types.length, `${category} should have types`).toBeGreaterThan(0);
		}
	});

	it("has 8 categories", () => {
		expect(Object.keys(ontology)).toHaveLength(8);
	});

	it("has no duplicate element types across categories", () => {
		const seen = new Map<string, string>();
		for (const [category, types] of Object.entries(ontology)) {
			for (const t of types) {
				expect(
					seen.has(t),
					`"${t}" appears in both "${seen.get(t)}" and "${category}"`,
				).toBe(false);
				seen.set(t, category);
			}
		}
	});

	it("total entries across all categories equals 17", () => {
		const total = Object.values(ontology).reduce(
			(sum, arr) => sum + arr.length,
			0,
		);
		expect(total).toBe(17);
	});
});

describe("categoryOf", () => {
	it("returns the correct category for known types", () => {
		expect(categoryOf(ElementType.Title)).toBe("text");
		expect(categoryOf(ElementType.NarrativeText)).toBe("text");
		expect(categoryOf(ElementType.ListItem)).toBe("text");
		expect(categoryOf(ElementType.Header)).toBe("text");
		expect(categoryOf(ElementType.Footer)).toBe("text");
		expect(categoryOf(ElementType.FigureCaption)).toBe("text");
		expect(categoryOf(ElementType.Address)).toBe("text");
		expect(categoryOf(ElementType.UncategorizedText)).toBe("text");
		expect(categoryOf(ElementType.Table)).toBe("table");
		expect(categoryOf(ElementType.Image)).toBe("media");
		expect(categoryOf(ElementType.CodeSnippet)).toBe("code");
		expect(categoryOf(ElementType.Formula)).toBe("math");
		expect(categoryOf(ElementType.CheckBox)).toBe("form");
		expect(categoryOf(ElementType.FormKeysValues)).toBe("form");
		expect(categoryOf(ElementType.PageBreak)).toBe("layout");
		expect(categoryOf(ElementType.PageNumber)).toBe("layout");
		expect(categoryOf(ElementType.EmailMessage)).toBe("email");
	});

	it("returns undefined for unknown types", () => {
		expect(categoryOf("unknown")).toBeUndefined();
		expect(categoryOf("")).toBeUndefined();
	});
});
