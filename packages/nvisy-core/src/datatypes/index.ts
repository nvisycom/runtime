export type { DataOptions, JsonValue, Metadata } from "./base-datatype.js";
export { Data } from "./base-datatype.js";
export type { ChunkOptions } from "./chunk-datatype.js";
export { Chunk } from "./chunk-datatype.js";
export type {
	DocumentElement,
	DocumentOptions,
	DocumentPage,
	DocumentSection,
	ElementType,
} from "./document-datatype.js";
export { Document } from "./document-datatype.js";
export { Embedding } from "./embedding-datatype.js";
export type { BlobOptions } from "./object-datatype.js";
export { Blob } from "./object-datatype.js";
export { Row } from "./row-datatype.js";

import type { DataOptions, JsonValue } from "./base-datatype.js";
import type { ChunkOptions } from "./chunk-datatype.js";
import { Chunk } from "./chunk-datatype.js";
import type { DocumentOptions } from "./document-datatype.js";
import { Document } from "./document-datatype.js";
import { Embedding } from "./embedding-datatype.js";
import type { BlobOptions } from "./object-datatype.js";
import { Blob } from "./object-datatype.js";
import { Row } from "./row-datatype.js";

/** Union of all concrete data types that flow through the pipeline. */
export type DataType = Document | Embedding | Blob | Chunk | Row;

/** Factory methods for creating data type instances. */
export const DataType = {
	/** Create a structured document with text content. */
	Document(content: string, options?: DocumentOptions): Document {
		return new Document(content, options);
	},

	/** Create a dense vector embedding. */
	Embedding(vector: Float32Array | number[], options?: DataOptions): Embedding {
		return new Embedding(vector, options);
	},

	/** Create a binary blob from object storage. */
	Blob(path: string, data: Buffer, options?: BlobOptions): Blob {
		return new Blob(path, data, options);
	},

	/** Create a text chunk from a chunking step. */
	Chunk(content: string, options?: ChunkOptions): Chunk {
		return new Chunk(content, options);
	},

	/** Create a database row with column values. */
	Row(columns: Record<string, JsonValue>, options?: DataOptions): Row {
		return new Row(columns, options);
	},
} as const;
