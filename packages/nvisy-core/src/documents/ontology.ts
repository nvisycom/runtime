/**
 * Element ontology — hierarchical categories for document elements.
 *
 * Every concrete {@link ElementType} belongs to exactly one
 * {@link ElementCategory}. Categories let downstream consumers handle
 * broad groups of elements (e.g. all text, all media) without matching
 * individual types.
 *
 * Per-category const objects ({@link TextType}, {@link TableType}, etc.)
 * are the single source of truth. The master {@link ElementType} is
 * derived by spreading all category objects.
 *
 * @example
 * ```ts
 * import { categoryOf, ElementType, TextType } from "@nvisy/core";
 *
 * categoryOf("title");          // => "text"
 * categoryOf("table");          // => "table"
 * ElementType.Title;            // => "title"
 * TextType.NarrativeText;       // => "narrative-text"
 * ```
 *
 * @module
 */

export const TextType = {
	Title: "title",
	NarrativeText: "narrative-text",
	ListItem: "list-item",
	Header: "header",
	Footer: "footer",
	FigureCaption: "figure-caption",
	Address: "address",
	UncategorizedText: "uncategorized-text",
} as const;
export type TextType = (typeof TextType)[keyof typeof TextType];

export const TableType = { Table: "table" } as const;
export type TableType = (typeof TableType)[keyof typeof TableType];

export const MediaType = { Image: "image" } as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const CodeType = { CodeSnippet: "code-snippet" } as const;
export type CodeType = (typeof CodeType)[keyof typeof CodeType];

export const MathType = { Formula: "formula" } as const;
export type MathType = (typeof MathType)[keyof typeof MathType];

export const FormType = {
	CheckBox: "checkbox",
	FormKeysValues: "form-keys-values",
} as const;
export type FormType = (typeof FormType)[keyof typeof FormType];

export const LayoutType = {
	PageBreak: "page-break",
	PageNumber: "page-number",
} as const;
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType];

export const EmailType = { EmailMessage: "email-message" } as const;
export type EmailType = (typeof EmailType)[keyof typeof EmailType];

/** Union of all per-category element type values. */
export const ElementType = {
	...TextType,
	...TableType,
	...MediaType,
	...CodeType,
	...MathType,
	...FormType,
	...LayoutType,
	...EmailType,
} as const;
export type ElementType = (typeof ElementType)[keyof typeof ElementType];

export type ElementCategory =
	| "text"
	| "table"
	| "media"
	| "code"
	| "math"
	| "form"
	| "layout"
	| "email";

/**
 * Map from {@link ElementCategory} to the element types it contains.
 *
 * This is the single source of truth for which types belong to which
 * category. Use {@link categoryOf} for reverse lookups.
 */
export const ontology: Record<ElementCategory, readonly ElementType[]> = {
	text: Object.values(TextType),
	table: Object.values(TableType),
	media: Object.values(MediaType),
	code: Object.values(CodeType),
	math: Object.values(MathType),
	form: Object.values(FormType),
	layout: Object.values(LayoutType),
	email: Object.values(EmailType),
};

const reverseMap = new Map<string, ElementCategory>();
for (const [category, types] of Object.entries(ontology)) {
	for (const t of types) {
		reverseMap.set(t, category as ElementCategory);
	}
}

/**
 * Return the {@link ElementCategory} for a given element type string.
 *
 * @returns The category, or `undefined` for unrecognised types.
 *
 * @example
 * ```ts
 * categoryOf("title");   // => "text"
 * categoryOf("unknown"); // => undefined
 * ```
 */
export function categoryOf(type: string): ElementCategory | undefined {
	return reverseMap.get(type);
}
