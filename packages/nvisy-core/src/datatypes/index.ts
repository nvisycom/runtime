/**
 * @module datatypes
 *
 * Base data model and built-in document type for the Nvisy pipeline.
 */

export type { JsonValue, Metadata } from "./data.js";
export { Data } from "./data.js";
export type {
	DocumentElement,
	DocumentOptions,
	DocumentPage,
	DocumentSection,
	ElementType,
} from "./document.js";
export { Document } from "./document.js";

import type { ClassRef } from "../types.js";
import type { Data } from "./data.js";

/**
 * A custom data type registered by a plugin.
 *
 * Plugins use this to extend the type system with new {@link Data}
 * subclasses without modifying nvisy-core.
 */
export interface Datatype {
	/** Unique identifier for this data type (e.g. "audio", "image"). */
	readonly id: string;
	/** Class reference for the custom data type. */
	readonly dataClass: ClassRef<Data>;
}

/** Factory for creating data type entries. */
export const Datatypes = {
	/** Create a Datatype for registering a custom data type with a plugin. */
	define(id: string, dataClass: ClassRef<Data>): Datatype {
		return { id, dataClass };
	},
} as const;
