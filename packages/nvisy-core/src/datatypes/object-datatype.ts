import type { DataOptions } from "./base-datatype.js";
import { Data } from "./base-datatype.js";

/** Options for constructing a {@link Blob}. */
export interface BlobOptions extends DataOptions {
	readonly contentType?: string;
}

/**
 * A file or binary blob retrieved from object storage (S3, GCS, Dropbox, etc.).
 *
 * Wraps raw bytes together with their storage path and MIME type so
 * downstream processors can decide how to parse the content.
 *
 * @example
 * ```ts
 * const obj = new Blob("uploads/report.pdf", Buffer.from(pdfBytes));
 * console.log(obj.size); // byte length
 * ```
 */
export class Blob extends Data {
	readonly #path: string;
	readonly #data: Buffer;
	readonly #contentType?: string | undefined;

	constructor(path: string, data: Buffer, options?: BlobOptions) {
		super(options);
		this.#path = path;
		this.#data = data;
		this.#contentType = options?.contentType;
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
