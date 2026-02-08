/**
 * Abstract base data class for all pipeline data types.
 *
 * @module
 */

import type { Metadata } from "../types.js";

/**
 * Abstract base class for all data types flowing through the pipeline.
 *
 * Every piece of data in the system — documents, embeddings, database rows,
 * storage objects — extends this class, guaranteeing a unique {@link id} and
 * optional key-value {@link metadata}.
 *
 * Use {@link deriveFrom} to set lineage and copy metadata from a parent in
 * one call. Use {@link withParent} and {@link withMetadata} for manual
 * control. All fluent setters return `this` for chaining.
 */
export abstract class Data {
	readonly #id: string = crypto.randomUUID();
	#parentId: string | null = null;
	#metadata: Metadata | null = null;

	/** Unique identifier for this data item. */
	get id(): string {
		return this.#id;
	}

	/** ID of the parent data item this was derived from. `null` when this is a root item. */
	get parentId(): string | null {
		return this.#parentId;
	}

	/** `true` when this item was derived from another (i.e. {@link parentId} is set). */
	get isDerived(): boolean {
		return this.#parentId !== null;
	}

	/** Key-value metadata attached to this data item. `null` when unset. */
	get metadata(): Metadata | null {
		return this.#metadata;
	}

	/**
	 * Mark this item as derived from `parent`, copying its {@link id} as
	 * {@link parentId} and its {@link metadata}. Returns `this` for chaining.
	 */
	deriveFrom(parent: Data): this {
		this.#parentId = parent.#id;
		this.#metadata = parent.#metadata;
		return this;
	}

	/** Set the parent ID for lineage tracking. Returns `this` for chaining. */
	withParent(id: string | null): this {
		this.#parentId = id;
		return this;
	}

	/** Set or replace metadata. Returns `this` for chaining. */
	withMetadata(metadata: Metadata | null): this {
		this.#metadata = metadata;
		return this;
	}
}
