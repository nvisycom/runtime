import type { Document } from "#data/document.js";
import type { Embedding } from "#data/embedding.js";
import type { Blob } from "#data/object.js";
import type { Row } from "#data/record.js";

export { Data } from "#data/base.js";
export { Document } from "#data/document.js";
export { Embedding } from "#data/embedding.js";
export { Blob } from "#data/object.js";
export { Row } from "#data/record.js";

/** Union of all concrete data types that can flow through the pipeline. */
export type AnyData = Document | Embedding | Blob | Row;
