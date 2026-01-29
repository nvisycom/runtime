import type { JsonValue } from "../types/json.js";

/** A row from a relational database. */
export interface RecordData {
	/** Column name → value mapping. */
	columns: Record<string, JsonValue>;
}
