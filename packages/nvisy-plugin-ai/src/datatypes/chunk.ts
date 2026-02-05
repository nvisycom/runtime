import { Data } from "@nvisy/core";

/** Options for constructing a {@link Chunk}. */
export interface ChunkOptions {
	readonly chunkIndex?: number;
	readonly chunkTotal?: number;
}

/**
 * A text segment produced by a chunking step.
 *
 * Represents a portion of a larger {@link Document} after splitting.
 * Carries optional provenance fields ({@link chunkIndex},
 * {@link chunkTotal}) so downstream steps can trace chunks back to their
 * origin. Use {@link Data.withParent | withParent} to set the source document ID.
 *
 * @example
 * ```ts
 * const chunk = new Chunk("First paragraph…", {
 *   chunkIndex: 0,
 *   chunkTotal: 5,
 * }).deriveFrom(doc);
 * ```
 */
export class Chunk extends Data {
	readonly #content: string;
	readonly #chunkIndex?: number | undefined;
	readonly #chunkTotal?: number | undefined;

	constructor(content: string, options?: ChunkOptions) {
		super();
		this.#content = content;
		this.#chunkIndex = options?.chunkIndex;
		this.#chunkTotal = options?.chunkTotal;
	}

	/** Text content of this chunk. */
	get content(): string {
		return this.#content;
	}

	/** Zero-based index of this chunk within the source document. */
	get chunkIndex(): number | undefined {
		return this.#chunkIndex;
	}

	/** Total number of chunks the source document was split into. */
	get chunkTotal(): number | undefined {
		return this.#chunkTotal;
	}
}
