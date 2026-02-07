/**
 * Shared type aliases used across the core library.
 *
 * @module
 */

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

/** Constructor reference for runtime `instanceof` checks and generic type inference. */
export type ClassRef<T> = abstract new (...args: never[]) => T;
