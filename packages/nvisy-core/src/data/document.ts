import type { JsonValue, Metadata } from "./types.js";

/** A structured document with content and metadata. */
export class DocumentData {
	readonly id: string;
	readonly content: JsonValue;
	readonly contentType?: string | undefined;
	readonly metadata?: Metadata | undefined;

	constructor(fields: {
		id: string;
		content: JsonValue;
		contentType?: string;
		metadata?: Metadata;
	}) {
		this.id = fields.id;
		this.content = fields.content;
		this.contentType = fields.contentType;
		this.metadata = fields.metadata;
	}
}
