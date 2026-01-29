import type { Metadata } from "../types/json.js";

/** A vector embedding with metadata. */
export interface EmbeddingData {
	/** Unique embedding identifier. */
	id: string;
	/** The embedding vector. */
	vector: number[];
	/** Dimensionality of the vector. */
	dimensions: number;
	/** Arbitrary metadata. */
	metadata?: Metadata;
}
