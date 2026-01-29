/** JSON-compatible value type. */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

/** Key-value metadata attached to data items. */
export type Metadata = Record<string, JsonValue>;
