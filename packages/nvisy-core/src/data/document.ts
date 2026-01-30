import type { JsonValue, Metadata } from "#utils/types.js";
import { Data } from "#data/base.js";

/**
 * A structured document with arbitrary JSON content.
 *
 * Represents parsed output from a partition step — the raw bytes have
 * already been converted into a structured form that can be chunked,
 * enriched, or extracted from.
 *
 * @example
 * ```ts
 * const doc = new Document({ title: "Quarterly Report", pages: [...] });
 * ```
 */
export class Document extends Data {
	readonly #content: JsonValue;
	readonly #contentType?: string | undefined;

	constructor(
		content: JsonValue,
		options?: { id?: string; contentType?: string; metadata?: Metadata },
	) {
		super(options?.id, options?.metadata);
		this.#content = content;
		this.#contentType = options?.contentType;
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
