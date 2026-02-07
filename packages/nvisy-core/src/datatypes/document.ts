import type { Element } from "../documents/elements.js";
import { Data } from "./data.js";

export type {
	CompositeElementOptions,
	ElementOptions,
	ElementProvenance,
	EmailElementOptions,
	EmphasizedText,
	FormElementOptions,
	FormKeyValuePair,
	ImageElementOptions,
	Link,
	TableCellData,
	TableElementOptions,
} from "../documents/elements.js";
export {
	CompositeElement,
	Element,
	EmailElement,
	FormElement,
	ImageElement,
	TableElement,
} from "../documents/elements.js";

/** Options for constructing a {@link Document}. */
export interface DocumentOptions {
	readonly sourceType?: string;
	/** Document title (e.g. HTML `<title>`, PDF metadata). */
	readonly title?: string;
	/** Pre-extracted structural elements. */
	readonly elements?: readonly Element[];
}

/**
 * A parsed human-readable text representation of a document.
 *
 * Represents extracted text from a partition step — the raw bytes have
 * already been converted into plain text that can be chunked, enriched,
 * or embedded.
 *
 * Structural detail is carried as a flat array of {@link Element}
 * instances. Hierarchy is expressed via `parentId` references and page
 * membership via `pageNumber` on each element.
 *
 * @example
 * ```ts
 * const doc = Document.fromElements([
 *   new Element({ type: "title", text: "Quarterly Report", pageNumber: 1 }),
 *   new Element({ type: "narrative-text", text: "Revenue increased…", pageNumber: 1 }),
 * ], { sourceType: "pdf" });
 * ```
 */
export class Document extends Data {
	readonly #content: string;
	readonly #sourceType?: string | undefined;
	readonly #title?: string | undefined;
	readonly #elements?: readonly Element[] | undefined;

	constructor(content: string, options?: DocumentOptions) {
		super();
		this.#content = content;
		this.#sourceType = options?.sourceType;
		this.#title = options?.title;
		this.#elements = options?.elements;
	}

	/** Text content of the document. */
	get content(): string {
		return this.#content;
	}

	/** Origin format (e.g. "pdf", "markdown", "docx", "html", "transcript", "database"). */
	get sourceType(): string | undefined {
		return this.#sourceType;
	}

	/** Document title (e.g. HTML `<title>`, PDF metadata). */
	get title(): string | undefined {
		return this.#title;
	}

	/** Unique BCP-47 language tags collected from all elements. */
	get languages(): readonly string[] {
		if (this.#elements == null) return [];
		const set = new Set<string>();
		for (const el of this.#elements) {
			if (el.languages != null) {
				for (const lang of el.languages) {
					set.add(lang);
				}
			}
		}
		return [...set];
	}

	/** Flat ordered list of structural elements. */
	get elements(): readonly Element[] | undefined {
		return this.#elements;
	}

	/**
	 * Create a Document by deriving `content` from the element texts.
	 *
	 * Element texts are joined with `\n\n` separators.
	 */
	static fromElements(
		elements: readonly Element[],
		options?: Omit<DocumentOptions, "elements">,
	): Document {
		const content = elements.map((el) => el.text).join("\n\n");
		return new Document(content, { ...options, elements });
	}
}
