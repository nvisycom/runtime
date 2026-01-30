import type { Metadata } from "#utils/types.js";

/**
 * Abstract base class for all data types flowing through the pipeline.
 *
 * Every piece of data in the system — documents, embeddings, database rows,
 * storage objects — extends this class, guaranteeing a unique {@link id} and
 * optional key-value {@link metadata}.
 *
 * Fields are stored as private `#` properties and exposed through read-only
 * getters to enforce immutability after construction.
 */
export abstract class Data {
	readonly #id: string;
	readonly #metadata?: Metadata | undefined;

	constructor(id: string, metadata?: Metadata) {
		this.#id = id;
		this.#metadata = metadata;
	}

	/** Unique identifier for this data item. */
	get id(): string {
		return this.#id;
	}

	/** Optional key-value metadata attached to this data item. */
	get metadata(): Metadata | undefined {
		return this.#metadata;
	}
}
