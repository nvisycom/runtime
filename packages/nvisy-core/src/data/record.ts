import type { JsonValue, Metadata } from "#utils/types.js";
import { Data } from "#data/base.js";

/**
 * A row from a relational database.
 *
 * Maps column names to JSON-compatible values. Use the {@link get} helper
 * for safe column access that returns `undefined` on missing keys rather
 * than throwing.
 *
 * @example
 * ```ts
 * const row = new RecordData({
 *   id: "row-42",
 *   columns: { name: "Alice", age: 30, active: true },
 * });
 * row.get("name"); // "Alice"
 * row.get("missing"); // undefined
 * ```
 */
export class RecordData extends Data {
	readonly #columns: Readonly<Record<string, JsonValue>>;

	constructor(fields: {
		id: string;
		columns: Record<string, JsonValue>;
		metadata?: Metadata;
	}) {
		super(fields.id, fields.metadata);
		this.#columns = fields.columns;
	}

	/** Column name → value mapping. */
	get columns(): Readonly<Record<string, JsonValue>> {
		return this.#columns;
	}

	/** Get a column value by name, or `undefined` if missing. */
	get(column: string): JsonValue | undefined {
		return this.#columns[column];
	}
}
