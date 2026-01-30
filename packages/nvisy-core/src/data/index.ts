import type { DocumentData } from "#data/document.js";
import type { EmbeddingData } from "#data/embedding.js";
import type { ObjectData } from "#data/object.js";
import type { RecordData } from "#data/record.js";

export { Data } from "#data/base.js";
export { DocumentData } from "#data/document.js";
export { EmbeddingData } from "#data/embedding.js";
export { ObjectData } from "#data/object.js";
export { RecordData } from "#data/record.js";

/** Union of all concrete data types that can flow through the pipeline. */
export type AnyDataValue =
	| DocumentData
	| EmbeddingData
	| ObjectData
	| RecordData;
