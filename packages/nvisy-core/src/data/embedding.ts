import type { Metadata } from "./types.js";

/** A vector embedding with metadata. */
export class EmbeddingData {
	readonly id: string;
	readonly vector: Float64Array;
	readonly metadata?: Metadata | undefined;

	constructor(fields: {
		id: string;
		vector: Float64Array | number[];
		metadata?: Metadata;
	}) {
		this.id = fields.id;
		this.vector =
			fields.vector instanceof Float64Array
				? fields.vector
				: new Float64Array(fields.vector);
		this.metadata = fields.metadata;
	}

	/** Dimensionality of the embedding vector. */
	get dimensions(): number {
		return this.vector.length;
	}
}
