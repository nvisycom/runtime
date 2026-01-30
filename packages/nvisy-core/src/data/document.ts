import type { JsonValue, Metadata } from "#utils/types.js";
import { Data } from "./base.js";

/**
 * A structured document with arbitrary JSON content.
 *
 * Represents parsed output from a partition step — the raw bytes have
 * already been converted into a structured form that can be chunked,
 * enriched, or extracted from.
 *
 * @example
 * ```ts
 * const doc = new DocumentData({
 *   id: "doc-001",
 *   content: { title: "Quarterly Report", pages: [...] },
 *   contentType: "application/json",
 * });
 * ```
 */
export class DocumentData extends Data {
	readonly #content: JsonValue;
	readonly #contentType?: string | undefined;

	constructor(fields: {
		id: string;
		content: JsonValue;
		contentType?: string;
		metadata?: Metadata;
	}) {
		super(fields.id, fields.metadata);
		this.#content = fields.content;
		this.#contentType = fields.contentType;
	}

	/** Structured content of the document. */
	get content(): JsonValue {
		return this.#content;
	}

	/** Format of the content (e.g. `"text/markdown"`, `"application/json"`). */
	get contentType(): string | undefined {
		return this.#contentType;
	}
}
