export { Data } from "#datatypes/base-datatype.js";
export type { JsonValue, Metadata, DataOptions } from "#datatypes/base-datatype.js";
export { Document } from "#datatypes/document-datatype.js";
export type { DocumentOptions } from "#datatypes/document-datatype.js";
export { Embedding } from "#datatypes/embeddings-datatype.js";
export { Blob } from "#datatypes/object-datatype.js";
export type { BlobOptions } from "#datatypes/object-datatype.js";
export { Row } from "#datatypes/record-datatype.js";

import type { JsonValue, DataOptions } from "#datatypes/base-datatype.js";
import { Document } from "#datatypes/document-datatype.js";
import type { DocumentOptions } from "#datatypes/document-datatype.js";
import { Embedding } from "#datatypes/embeddings-datatype.js";
import { Blob } from "#datatypes/object-datatype.js";
import type { BlobOptions } from "#datatypes/object-datatype.js";
import { Row } from "#datatypes/record-datatype.js";

/** Union of all concrete data types that flow through the pipeline. */
export type DataType = Document | Embedding | Blob | Row;

export const DataType = {
	Document(content: JsonValue, options?: DocumentOptions): Document {
		return new Document(content, options);
	},

	Embedding(vector: Float32Array | number[], options?: DataOptions): Embedding {
		return new Embedding(vector, options);
	},

	Blob(path: string, data: Buffer, options?: BlobOptions): Blob {
		return new Blob(path, data, options);
	},

	Row(columns: Record<string, JsonValue>, options?: DataOptions): Row {
		return new Row(columns, options);
	},
} as const;
