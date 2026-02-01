import { Data } from "#datatypes/base-datatype.js";
import type { JsonValue, DataOptions } from "#datatypes/base-datatype.js";

/** Options for constructing a {@link Document}. */
export interface DocumentOptions extends DataOptions {
	readonly contentType?: string;
}

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

	constructor(content: JsonValue, options?: DocumentOptions) {
		super(options);
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
