import type { Metadata } from "#utils/types.js";
import { Data } from "./base.js";

/**
 * A file or binary blob retrieved from object storage (S3, GCS, Dropbox, etc.).
 *
 * Wraps raw bytes together with their storage path and MIME type so
 * downstream processors can decide how to parse the content.
 *
 * @example
 * ```ts
 * const obj = new ObjectData({
 *   id: "doc-001",
 *   path: "uploads/report.pdf",
 *   data: Buffer.from(pdfBytes),
 *   contentType: "application/pdf",
 * });
 * console.log(obj.size); // byte length
 * ```
 */
export class ObjectData extends Data {
	readonly #path: string;
	readonly #data: Buffer;
	readonly #contentType?: string | undefined;

	constructor(fields: {
		id: string;
		path: string;
		data: Buffer;
		contentType?: string;
		metadata?: Metadata;
	}) {
		super(fields.id, fields.metadata);
		this.#path = fields.path;
		this.#data = fields.data;
		this.#contentType = fields.contentType;
	}

	/** Storage path or key (e.g. `"s3://bucket/file.pdf"`). */
	get path(): string {
		return this.#path;
	}

	/** Raw binary content. */
	get data(): Buffer {
		return this.#data;
	}

	/** MIME type of the content (e.g. `"application/pdf"`). */
	get contentType(): string | undefined {
		return this.#contentType;
	}

	/** Size of the raw data in bytes. */
	get size(): number {
		return this.#data.byteLength;
	}
}
