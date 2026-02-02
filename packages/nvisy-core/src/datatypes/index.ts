export type { DataOptions, JsonValue, Metadata } from "./base-datatype.js";
export { Data } from "./base-datatype.js";
export type { DocumentOptions } from "./document-datatype.js";
export { Document } from "./document-datatype.js";
export { Embedding } from "./embeddings-datatype.js";
export type { BlobOptions } from "./object-datatype.js";
export { Blob } from "./object-datatype.js";
export { Row } from "./record-datatype.js";

import type { DataOptions, JsonValue } from "./base-datatype.js";
import type { DocumentOptions } from "./document-datatype.js";
import { Document } from "./document-datatype.js";
import { Embedding } from "./embeddings-datatype.js";
import type { BlobOptions } from "./object-datatype.js";
import { Blob } from "./object-datatype.js";
import { Row } from "./record-datatype.js";

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
