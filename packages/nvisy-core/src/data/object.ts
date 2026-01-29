import type { Metadata } from "../types/json.js";

/** A file or binary object from storage (S3, GCS, Dropbox, etc.). */
export interface ObjectData {
	/** Storage path or key. */
	path: string;
	/** Raw binary data. */
	data: Buffer;
	/** MIME content type (e.g. "application/pdf"). */
	contentType?: string;
	/** Arbitrary metadata. */
	metadata?: Metadata;
}
