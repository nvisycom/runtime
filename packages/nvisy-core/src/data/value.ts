import type { ChunkData } from "./chunk.js";
import type { DocumentData } from "./document.js";
import type { EmbeddingData } from "./embedding.js";
import type { ObjectData } from "./object.js";
import type { RecordData } from "./record.js";

/**
 * Discriminated union of all data types that flow through the pipeline.
 * This is the "currency" that nodes produce and consume.
 */
export type AnyDataValue =
	| { kind: "object"; data: ObjectData }
	| { kind: "document"; data: DocumentData }
	| { kind: "record"; data: RecordData }
	| { kind: "embedding"; data: EmbeddingData }
	| { kind: "chunk"; data: ChunkData };
