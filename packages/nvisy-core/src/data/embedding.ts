import type { Metadata } from "#utils/types.js";
import { Data } from "#data/base.js";

/**
 * A dense vector embedding produced by an embedding model.
 *
 * Stores the vector as a `Float32Array` for memory efficiency and fast
 * math operations. Use {@link dimensions} to inspect the vector size
 * without accessing the underlying array.
 *
 * @example
 * ```ts
 * const e = new Embedding([0.12, -0.34, 0.56]);
 * console.log(e.dimensions); // 3
 * ```
 */
export class Embedding extends Data {
	readonly #vector: Float32Array;

	constructor(
		vector: Float32Array | number[],
		options?: { id?: string; metadata?: Metadata },
	) {
		super(options?.id, options?.metadata);
		this.#vector =
			vector instanceof Float32Array ? vector : new Float32Array(vector);
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
