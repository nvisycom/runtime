export { Data } from "#datatypes/base-datatype.js";
export type { JsonValue, Metadata } from "#datatypes/base-datatype.js";
export { Document } from "#datatypes/document-datatype.js";
export { Embedding } from "#datatypes/embeddings-datatype.js";
export { Blob } from "#datatypes/object-datatype.js";
export { Row } from "#datatypes/record-datatype.js";

import type { Metadata, JsonValue } from "#datatypes/base-datatype.js";
import { Document } from "#datatypes/document-datatype.js";
import { Embedding } from "#datatypes/embeddings-datatype.js";
import { Blob } from "#datatypes/object-datatype.js";
import { Row } from "#datatypes/record-datatype.js";

/** Union of all concrete data types that flow through the pipeline. */
export type DataType = Document | Embedding | Blob | Row;

export const DataType = {
	Document(
		content: JsonValue,
		options?: { id?: string; contentType?: string; metadata?: Metadata },
	): Document {
		return new Document(content, options);
	},

	Embedding(
		vector: Float32Array | number[],
		options?: { id?: string; metadata?: Metadata },
	): Embedding {
		return new Embedding(vector, options);
	},

	Blob(
		path: string,
		data: Buffer,
		options?: { id?: string; contentType?: string; metadata?: Metadata },
	): Blob {
		return new Blob(path, data, options);
	},

	Row(
		columns: Record<string, JsonValue>,
		options?: { id?: string; metadata?: Metadata },
	): Row {
		return new Row(columns, options);
	},
} as const;
