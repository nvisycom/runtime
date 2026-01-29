import type { Metadata } from "./types.js";

/** A file or binary blob from storage (S3, GCS, Dropbox, etc.). */
export class ObjectData {
	readonly path: string;
	readonly data: Buffer;
	readonly contentType?: string | undefined;
	readonly metadata?: Metadata | undefined;

	constructor(fields: {
		path: string;
		data: Buffer;
		contentType?: string;
		metadata?: Metadata;
	}) {
		this.path = fields.path;
		this.data = fields.data;
		this.contentType = fields.contentType;
		this.metadata = fields.metadata;
	}

	/** Size of the raw data in bytes. */
	get size(): number {
		return this.data.byteLength;
	}
}
