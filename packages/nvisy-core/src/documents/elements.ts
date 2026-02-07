/**
 * Document element model.
 *
 * Every structural piece of a parsed document — paragraphs, headings,
 * tables, images, etc. — is represented as an {@link Element} instance.
 * The {@link Element.type | type} field (one of the {@link ElementType}
 * string literals defined in `ontology.ts`) is the primary discriminator.
 *
 * Type-specific fields live on dedicated subclasses:
 *
 * | Subclass            | Category | Extra fields                              |
 * | ------------------- | -------- | ----------------------------------------- |
 * | {@link ImageElement} | media   | base64, mime type, URL, path              |
 * | {@link TableElement} | table   | structured cells                          |
 * | {@link FormElement}  | form    | checkbox state, value, key-value pairs    |
 * | {@link EmailElement} | email   | envelope (from, to, cc, bcc, subject, …)  |
 * | {@link CompositeElement} | any | pre-chunking original elements            |
 *
 * Extraction / OCR provenance fields are bundled in
 * {@link ElementProvenance} rather than scattered across the base class.
 *
 * Source-format fidelity is preserved via {@link Element.sourceTag} (the
 * original HTML tag or format-specific type name) and
 * {@link Element.textAsHtml} (original markup for round-tripping).
 *
 * @module
 */

import type { Metadata } from "../types.js";
import type { ElementCoordinates } from "./coordinates.js";
import type {
	ElementType,
	EmailType,
	FormType,
	MediaType,
	TableType,
} from "./ontology.js";

/** An inline hyperlink within element text. */
export interface Link {
	/** The visible link text. */
	readonly text: string;
	/** The target URL. */
	readonly url: string;
	/** 0-based character offset of the link text within the element's {@link Element.text}. */
	readonly startIndex: number;
}

/** An inline formatting span within element text. */
export interface EmphasizedText {
	/** The formatted text content. */
	readonly text: string;
	/** HTML tag name — `"b"`, `"i"`, `"em"`, `"strong"`, etc. */
	readonly tag: string;
}

/** A single cell within a table structure. */
export interface TableCellData {
	/** 0-based row index. */
	readonly row: number;
	/** 0-based column index. */
	readonly column: number;
	/** Plain-text content of the cell. */
	readonly text: string;
	/** `true` when this cell is part of the table header. */
	readonly isHeader?: boolean;
}

/** Extraction / OCR provenance fields bundled into a single object. */
export interface ElementProvenance {
	/** Spatial position on the source page (OCR, PDF). */
	readonly coordinates?: ElementCoordinates;
	/** Extraction confidence score (0–1). */
	readonly confidence?: number;
	/** Which model or system produced this element. */
	readonly detectionOrigin?: string;
	/** `true` when this element continues from a previous page or chunk. */
	readonly isContinuation?: boolean;
	/** Distinguishes page-header vs document-header, etc. */
	readonly headerFooterType?: string;
}

/** A structured key-value pair extracted from a form. */
export interface FormKeyValuePair {
	/** The field label. */
	readonly key: string;
	/** The field value, if present. */
	readonly value?: string;
	/** Extraction confidence score (0–1). */
	readonly confidence?: number;
}

/** Options for constructing an {@link Element}. */
export interface ElementOptions {
	/** The element's structural type. */
	readonly type: ElementType;
	/** Extracted text content. May be empty for non-textual elements. */
	readonly text: string;
	/** ID of the parent element (e.g. a table cell's parent row). */
	readonly parentId?: string;
	/** 1-based page number this element belongs to. */
	readonly pageNumber?: number;
	/** Named page or sheet (e.g. XLSX worksheet name). */
	readonly pageName?: string;
	/** Nesting depth — 1–6 for headings, 1+ for nested lists. */
	readonly level?: number;
	/** BCP-47 language tags detected for this element. */
	readonly languages?: readonly string[];
	/** Element-scoped metadata (e.g. table caption, alt text). */
	readonly metadata?: Metadata;
	/** Original source tag or format-specific type name (e.g. `"blockquote"`, `"dl"`). */
	readonly sourceTag?: string;
	/** Original markup for round-tripping (e.g. the HTML of a table row). */
	readonly textAsHtml?: string;
	/** Inline hyperlinks embedded in {@link text}. */
	readonly links?: readonly Link[];
	/** Bold / italic formatting spans embedded in {@link text}. */
	readonly emphasizedTexts?: readonly EmphasizedText[];
	/** Extraction / OCR provenance data. */
	readonly provenance?: ElementProvenance;
}

/**
 * A single structural element extracted from a document.
 *
 * Every element carries an {@link id}, a {@link type} discriminator,
 * and its extracted {@link text}. Type-specific fields live on
 * dedicated subclasses; provenance data is in {@link provenance}.
 *
 * Hierarchy is expressed via {@link parentId} references rather than
 * nesting, keeping the element array flat and easy to iterate.
 */
export class Element {
	/** Unique identifier for this element. */
	readonly id: string = crypto.randomUUID();
	/** The element's structural type. */
	readonly type: ElementType;
	/** Extracted text content. May be empty for non-textual elements. */
	readonly text: string;
	/** ID of the parent element (e.g. a table cell's parent row). */
	readonly parentId?: string | undefined;
	/** 1-based page number this element belongs to. */
	readonly pageNumber?: number | undefined;
	/** Named page or sheet (e.g. XLSX worksheet name). */
	readonly pageName?: string | undefined;
	/** Nesting depth — 1–6 for headings, 1+ for nested lists. */
	readonly level?: number | undefined;
	/** BCP-47 language tags detected for this element. */
	readonly languages?: readonly string[] | undefined;
	/** Element-scoped metadata (e.g. table caption, alt text). */
	readonly metadata?: Metadata | undefined;
	/** Original source tag or format-specific type name (e.g. `"blockquote"`, `"dl"`). */
	readonly sourceTag?: string | undefined;
	/** Original markup for round-tripping (e.g. the HTML of a table row). */
	readonly textAsHtml?: string | undefined;
	/** Inline hyperlinks embedded in {@link text}. */
	readonly links?: readonly Link[] | undefined;
	/** Bold / italic formatting spans embedded in {@link text}. */
	readonly emphasizedTexts?: readonly EmphasizedText[] | undefined;
	/** Extraction / OCR provenance data. */
	readonly provenance?: ElementProvenance | undefined;

	constructor(options: ElementOptions) {
		this.type = options.type;
		this.text = options.text;
		this.parentId = options.parentId;
		this.pageNumber = options.pageNumber;
		this.pageName = options.pageName;
		this.level = options.level;
		this.languages = options.languages;
		this.metadata = options.metadata;
		this.sourceTag = options.sourceTag;
		this.textAsHtml = options.textAsHtml;
		this.links = options.links;
		this.emphasizedTexts = options.emphasizedTexts;
		this.provenance = options.provenance;
	}
}

/**
 * Options for constructing an {@link ImageElement}.
 *
 * Narrows {@link ElementOptions.type | type} to {@link MediaType} and
 * adds fields for carrying image data in various forms.
 */
export interface ImageElementOptions extends ElementOptions {
	readonly type: MediaType;
	/** Base64-encoded image content. */
	readonly imageBase64?: string;
	/** MIME type of the image (e.g. `"image/png"`). */
	readonly imageMimeType?: string;
	/** Remote URL where the image can be fetched. */
	readonly imageUrl?: string;
	/** Local filesystem path to the image file. */
	readonly imagePath?: string;
}

/**
 * An element representing an image extracted from a document.
 *
 * Image data may be provided in one or more forms — inline base64,
 * a remote URL, or a local file path. Use `instanceof ImageElement`
 * for runtime type narrowing.
 */
export class ImageElement extends Element {
	/** Base64-encoded image content. */
	readonly imageBase64?: string | undefined;
	/** MIME type of the image (e.g. `"image/png"`). */
	readonly imageMimeType?: string | undefined;
	/** Remote URL where the image can be fetched. */
	readonly imageUrl?: string | undefined;
	/** Local filesystem path to the image file. */
	readonly imagePath?: string | undefined;

	constructor(options: ImageElementOptions) {
		super(options);
		this.imageBase64 = options.imageBase64;
		this.imageMimeType = options.imageMimeType;
		this.imageUrl = options.imageUrl;
		this.imagePath = options.imagePath;
	}
}

/**
 * Options for constructing a {@link TableElement}.
 *
 * Narrows {@link ElementOptions.type | type} to {@link TableType} and
 * adds structured cell data.
 */
export interface TableElementOptions extends ElementOptions {
	readonly type: TableType;
	/** Structured cell data for the table. */
	readonly cells?: readonly TableCellData[];
}

/**
 * An element representing a table extracted from a document.
 *
 * Structured cell data is in {@link cells}. The inherited
 * {@link Element.textAsHtml | textAsHtml} field can carry the
 * original `<table>` markup for lossless round-tripping.
 */
export class TableElement extends Element {
	/** Structured cell data for the table. */
	readonly cells?: readonly TableCellData[] | undefined;

	constructor(options: TableElementOptions) {
		super(options);
		this.cells = options.cells;
	}
}

/**
 * Options for constructing a {@link FormElement}.
 *
 * Narrows {@link ElementOptions.type | type} to {@link FormType} and
 * adds checkbox / form-field state.
 */
export interface FormElementOptions extends ElementOptions {
	readonly type: FormType;
	/** Checkbox checked state. */
	readonly checked?: boolean;
	/** Scalar form-field value. */
	readonly value?: string;
	/** Structured key-value pairs extracted from a form. */
	readonly keyValuePairs?: readonly FormKeyValuePair[];
}

/**
 * An element representing a form field or checkbox.
 *
 * Simple checkboxes use {@link checked}; richer forms use
 * {@link keyValuePairs} for structured key-value extraction.
 */
export class FormElement extends Element {
	/** Checkbox checked state. */
	readonly checked?: boolean | undefined;
	/** Scalar form-field value. */
	readonly value?: string | undefined;
	/** Structured key-value pairs extracted from a form. */
	readonly keyValuePairs?: readonly FormKeyValuePair[] | undefined;

	constructor(options: FormElementOptions) {
		super(options);
		this.checked = options.checked;
		this.value = options.value;
		this.keyValuePairs = options.keyValuePairs;
	}
}

/**
 * Options for constructing an {@link EmailElement}.
 *
 * Narrows {@link ElementOptions.type | type} to {@link EmailType} and
 * adds standard email envelope fields.
 */
export interface EmailElementOptions extends ElementOptions {
	readonly type: EmailType;
	/** Sender address(es). */
	readonly sentFrom?: readonly string[];
	/** Primary recipient address(es). */
	readonly sentTo?: readonly string[];
	/** CC recipient address(es). */
	readonly ccRecipient?: readonly string[];
	/** BCC recipient address(es). */
	readonly bccRecipient?: readonly string[];
	/** Email subject line. */
	readonly subject?: string;
	/** Email signature block. */
	readonly signature?: string;
	/** RFC 2822 Message-ID header value. */
	readonly emailMessageId?: string;
}

/**
 * An element representing an email message.
 *
 * Carries standard envelope fields (from, to, cc, bcc, subject) plus
 * optional signature and message-id for threading.
 */
export class EmailElement extends Element {
	/** Sender address(es). */
	readonly sentFrom?: readonly string[] | undefined;
	/** Primary recipient address(es). */
	readonly sentTo?: readonly string[] | undefined;
	/** CC recipient address(es). */
	readonly ccRecipient?: readonly string[] | undefined;
	/** BCC recipient address(es). */
	readonly bccRecipient?: readonly string[] | undefined;
	/** Email subject line. */
	readonly subject?: string | undefined;
	/** Email signature block. */
	readonly signature?: string | undefined;
	/** RFC 2822 Message-ID header value. */
	readonly emailMessageId?: string | undefined;

	constructor(options: EmailElementOptions) {
		super(options);
		this.sentFrom = options.sentFrom;
		this.sentTo = options.sentTo;
		this.ccRecipient = options.ccRecipient;
		this.bccRecipient = options.bccRecipient;
		this.subject = options.subject;
		this.signature = options.signature;
		this.emailMessageId = options.emailMessageId;
	}
}

/**
 * Options for constructing a {@link CompositeElement}.
 *
 * Requires the original pre-chunking elements that were merged to
 * form this composite.
 */
export interface CompositeElementOptions extends ElementOptions {
	/** The original elements that were merged during chunking. */
	readonly origElements: readonly Element[];
}

/**
 * A composite element formed by merging multiple elements during chunking.
 *
 * Preserves the original pre-chunking elements in {@link origElements}
 * so downstream consumers can access fine-grained structure if needed.
 */
export class CompositeElement extends Element {
	/** The original elements that were merged during chunking. */
	readonly origElements: readonly Element[];

	constructor(options: CompositeElementOptions) {
		super(options);
		this.origElements = options.origElements;
	}
}
