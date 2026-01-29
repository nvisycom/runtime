import type { JsonValue, Metadata } from "../types/json.js";

/** A structured document with content and metadata. */
export interface DocumentData {
	/** Unique document identifier. */
	id: string;
	/** Document content (parsed or raw). */
	content: JsonValue;
	/** MIME content type. */
	contentType?: string;
	/** Arbitrary metadata. */
	metadata?: Metadata;
}
