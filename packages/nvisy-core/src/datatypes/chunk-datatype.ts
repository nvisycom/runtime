import type { DataOptions } from "./base-datatype.js";
import { Data } from "./base-datatype.js";

/** Options for constructing a {@link Chunk}. */
export interface ChunkOptions extends DataOptions {
	readonly sourceId?: string;
	readonly chunkIndex?: number;
	readonly chunkTotal?: number;
}

/**
 * A text segment produced by a chunking step.
 *
 * Represents a portion of a larger {@link Document} after splitting.
 * Carries optional provenance fields ({@link sourceId}, {@link chunkIndex},
 * {@link chunkTotal}) so downstream steps can trace chunks back to their
 * origin.
 *
 * @example
 * ```ts
 * const chunk = new Chunk("First paragraph…", {
 *   sourceId: doc.id,
 *   chunkIndex: 0,
 *   chunkTotal: 5,
 * });
 * ```
 */
export class Chunk extends Data {
	readonly #content: string;
	readonly #sourceId?: string | undefined;
	readonly #chunkIndex?: number | undefined;
	readonly #chunkTotal?: number | undefined;

	constructor(content: string, options?: ChunkOptions) {
		super(options);
		this.#content = content;
		this.#sourceId = options?.sourceId;
		this.#chunkIndex = options?.chunkIndex;
		this.#chunkTotal = options?.chunkTotal;
	}

	/** Text content of this chunk. */
	get content(): string {
		return this.#content;
	}

	/** ID of the source document this chunk was derived from. */
	get sourceId(): string | undefined {
		return this.#sourceId;
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
