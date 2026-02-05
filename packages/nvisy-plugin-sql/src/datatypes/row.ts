import type { JsonValue } from "@nvisy/core";
import { Data } from "@nvisy/core";

/**
 * A row from a relational database.
 *
 * Maps column names to JSON-compatible values. Use the {@link get} helper
 * for safe column access that returns `undefined` on missing keys rather
 * than throwing.
 *
 * @example
 * ```ts
 * const row = new Row({ name: "Alice", age: 30, active: true });
 * row.get("name"); // "Alice"
 * row.get("missing"); // undefined
 * ```
 */
export class Row extends Data {
	readonly #columns: Readonly<Record<string, JsonValue>>;

	constructor(columns: Record<string, JsonValue>) {
		super();
		this.#columns = columns;
	}

	/** Column name -> value mapping. */
	get columns(): Readonly<Record<string, JsonValue>> {
		return this.#columns;
	}

	/** Get a column value by name, or `undefined` if missing. */
	get(column: string): JsonValue | undefined {
		return this.#columns[column];
	}
}
