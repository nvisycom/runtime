import type { Metadata } from "#utils/types.js";
import { Data } from "./base.js";

/**
 * A dense vector embedding produced by an embedding model.
 *
 * Stores the vector as a `Float32Array` for memory efficiency and fast
 * math operations. Use {@link dimensions} to inspect the vector size
 * without accessing the underlying array.
 *
 * @example
 * ```ts
 * const emb = new EmbeddingData({
 *   id: "emb-001",
 *   vector: [0.12, -0.34, 0.56],
 * });
 * console.log(emb.dimensions); // 3
 * ```
 */
export class EmbeddingData extends Data {
	readonly #vector: Float32Array;

	constructor(fields: {
		id: string;
		vector: Float32Array | number[];
		metadata?: Metadata;
	}) {
		super(fields.id, fields.metadata);
		this.#vector =
			fields.vector instanceof Float32Array
				? fields.vector
				: new Float32Array(fields.vector);
	}

	/** The dense embedding vector. */
	get vector(): Float32Array {
		return this.#vector;
	}

	/** Dimensionality of the embedding vector. */
	get dimensions(): number {
		return this.#vector.length;
	}
}
