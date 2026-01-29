import type { JsonValue } from "./types.js";

/** A row from a relational database. */
export class RecordData {
	readonly columns: Readonly<Record<string, JsonValue>>;

	constructor(columns: Record<string, JsonValue>) {
		this.columns = columns;
	}

	/** Get a column value by name, or undefined if missing. */
	get(column: string): JsonValue | undefined {
		return this.columns[column];
	}
}
