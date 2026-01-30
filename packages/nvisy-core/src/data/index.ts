import type { ChunkData } from "./chunk.js";
import type { DocumentData } from "./document.js";
import type { EmbeddingData } from "./embedding.js";
import type { ObjectData } from "./object.js";
import type { RecordData } from "./record.js";

export { ChunkData } from "./chunk.js";
export { DocumentData } from "./document.js";
export { EmbeddingData } from "./embedding.js";
export { ObjectData } from "./object.js";
export { RecordData } from "./record.js";
export type { JsonValue, Metadata } from "./types.js";

export type AnyDataValue =
	| ChunkData
	| DocumentData
	| EmbeddingData
	| ObjectData
	| RecordData;
