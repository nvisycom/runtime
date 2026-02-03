/**
 * A JSON-compatible value.
 *
 * Mirrors the types that `JSON.parse` can return and `JSON.stringify`
 * can accept, making it safe for serialisation boundaries (APIs,
 * databases, message queues).
 */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

/**
 * Key-value metadata bag attached to {@link Data} items.
 *
 * All values must be JSON-serialisable so metadata can travel across
 * process boundaries without lossy conversion.
 */
export type Metadata = Record<string, JsonValue>;

/**
 * Common options shared by all {@link Data} subclass constructors.
 *
 * Subclasses that need extra fields (e.g. `contentType`) should extend
 * this interface rather than redefining `id` and `metadata`.
 */
export interface DataOptions {
	readonly id?: string;
	readonly metadata?: Metadata | undefined;
}

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

	constructor(options?: DataOptions) {
		this.#id = options?.id ?? crypto.randomUUID();
		this.#metadata = options?.metadata;
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
