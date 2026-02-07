/**
 * @module datatypes
 *
 * Base data model and built-in types for the Nvisy pipeline.
 */

export type { JsonValue, Metadata } from "../types.js";
export { Blob } from "./blob.js";
export { Data } from "./data.js";
export type {
	CompositeElementOptions,
	DocumentOptions,
	ElementOptions,
	ElementProvenance,
	EmailElementOptions,
	EmphasizedText,
	FormElementOptions,
	FormKeyValuePair,
	ImageElementOptions,
	Link,
	TableCellData,
	TableElementOptions,
} from "./document.js";
export {
	CompositeElement,
	Document,
	Element,
	EmailElement,
	FormElement,
	ImageElement,
	TableElement,
} from "./document.js";
export { Embedding } from "./embedding.js";

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

import { Blob } from "./blob.js";
import { Document } from "./document.js";
import { Embedding } from "./embedding.js";

/** Pre-defined Document datatype entry. */
export const documentDatatype = Datatypes.define("document", Document);

/** Pre-defined Blob datatype entry. */
export const blobDatatype = Datatypes.define("blob", Blob);

/** Pre-defined Embedding datatype entry. */
export const embeddingDatatype = Datatypes.define("embedding", Embedding);
