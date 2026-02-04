import type { DataOptions, Metadata } from "./base-datatype.js";
import { Data } from "./base-datatype.js";

/** The kind of structural element within a document. */
export type ElementType =
	| "paragraph"
	| "heading"
	| "table"
	| "list"
	| "image"
	| "code";

/** A single structural element within a {@link DocumentSection}. */
export interface DocumentElement {
	readonly type: ElementType;
	readonly text: string;
	/** Heading level (1-6). Only meaningful when `type` is `"heading"`. */
	readonly level?: number;
	/** Element-scoped metadata (e.g. table caption, alt text). */
	readonly metadata?: Metadata;
}

/** A titled section containing elements and optional nested sub-sections. */
export interface DocumentSection {
	readonly title?: string;
	readonly elements: readonly DocumentElement[];
	readonly children?: readonly DocumentSection[];
}

/** A single page of a document. */
export interface DocumentPage {
	/** 1-based page number. */
	readonly pageNumber: number;
	readonly sections: readonly DocumentSection[];
}

/** Options for constructing a {@link Document}. */
export interface DocumentOptions extends DataOptions {
	readonly sourceType?: string;
	readonly pages?: readonly DocumentPage[];
}

/**
 * A parsed human-readable text representation of a document.
 *
 * Represents extracted text from a partition step — the raw bytes have
 * already been converted into plain text that can be chunked, enriched,
 * or embedded.
 *
 * @example
 * ```ts
 * const doc = new Document("Quarterly Report\n\nRevenue increased…", {
 *   sourceType: "pdf",
 * });
 * ```
 */
export class Document extends Data {
	readonly #content: string;
	readonly #sourceType?: string | undefined;
	readonly #pages?: readonly DocumentPage[] | undefined;

	constructor(content: string, options?: DocumentOptions) {
		super(options);
		this.#content = content;
		this.#sourceType = options?.sourceType;
		this.#pages = options?.pages;
	}

	/** Text content of the document. */
	get content(): string {
		return this.#content;
	}

	/** Origin format (e.g. "pdf", "markdown", "docx", "html", "transcript", "database"). */
	get sourceType(): string | undefined {
		return this.#sourceType;
	}

	/** Optional hierarchical page structure. */
	get pages(): readonly DocumentPage[] | undefined {
		return this.#pages;
	}

	/** All elements across all pages and sections, flattened in document order. */
	get flatElements(): DocumentElement[] {
		if (this.#pages == null) return [];
		return collectElements(this.#pages);
	}

	/**
	 * Create a Document by deriving `content` from the element texts in the given pages.
	 *
	 * Element texts are joined with `\n\n` separators.
	 */
	static fromPages(
		pages: readonly DocumentPage[],
		options?: Omit<DocumentOptions, "pages">,
	): Document {
		const content = flattenPagesToText(pages);
		return new Document(content, { ...options, pages });
	}
}

/** Collect all elements from a page tree in document order. */
function collectElements(pages: readonly DocumentPage[]): DocumentElement[] {
	const out: DocumentElement[] = [];
	for (const page of pages) {
		for (const section of page.sections) {
			flattenSection(section, out);
		}
	}
	return out;
}

/** Recursively collect elements from a section and its children. */
function flattenSection(
	section: DocumentSection,
	out: DocumentElement[],
): void {
	for (const el of section.elements) {
		out.push(el);
	}
	if (section.children) {
		for (const child of section.children) {
			flattenSection(child, out);
		}
	}
}

/** Derive plain text content from a page tree. */
function flattenPagesToText(pages: readonly DocumentPage[]): string {
	const elements = collectElements(pages);
	return elements.map((el) => el.text).join("\n\n");
}
