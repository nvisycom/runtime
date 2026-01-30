import type { DocumentData } from "./document.js";
import type { EmbeddingData } from "./embedding.js";
import type { ObjectData } from "./object.js";
import type { RecordData } from "./record.js";

export { Data } from "./base.js";
export { DocumentData } from "./document.js";
export { EmbeddingData } from "./embedding.js";
export { ObjectData } from "./object.js";
export { RecordData } from "./record.js";

/** Union of all concrete data types that can flow through the pipeline. */
export type AnyDataValue =
	| DocumentData
	| EmbeddingData
	| ObjectData
	| RecordData;
