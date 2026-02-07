/**
 * @module @nvisy/core
 *
 * Public API surface for the nvisy core library.
 */

export type { ActionInstance } from "./actions/index.js";
export { Action, chunkSimple, partition } from "./actions/index.js";
export type {
	ChunkOptions,
	CompositeElementOptions,
	Datatype,
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
} from "./datatypes/index.js";
export {
	Blob,
	Chunk,
	CompositeElement,
	Data,
	Datatypes,
	Document,
	Element,
	EmailElement,
	Embedding,
	FormElement,
	ImageElement,
	TableElement,
} from "./datatypes/index.js";
export type {
	ElementCategory,
	ElementCoordinates,
	Orientation,
	Point,
} from "./documents/index.js";
export {
	CodeType,
	CoordinateSystem,
	categoryOf,
	ElementType,
	EmailType,
	FormType,
	LayoutType,
	MathType,
	MediaType,
	Orientations,
	ontology,
	TableType,
	TextType,
} from "./documents/index.js";
export type { ErrorContext } from "./errors/index.js";
export {
	CancellationError,
	ConnectionError,
	RuntimeError,
	TimeoutError,
	ValidationError,
} from "./errors/index.js";
export type { LoaderConfig, LoaderInstance, LoadFn } from "./loader.js";
export { Loader } from "./loader.js";
export type {
	AnyActionInstance,
	AnyLoaderInstance,
	AnyProviderFactory,
	AnyStreamSource,
	AnyStreamTarget,
	PluginInstance,
} from "./plugin.js";
export { Plugin } from "./plugin.js";
export type {
	ConnectedInstance,
	ProviderFactory,
	ProviderInstance,
} from "./provider.js";
export { Provider } from "./provider.js";
export type {
	Resumable,
	StreamSource,
	StreamTarget,
	WriterFn,
} from "./stream.js";
export { Stream } from "./stream.js";
export type { ClassRef, JsonValue, Metadata } from "./types.js";

import { chunkSimple, partition } from "./actions/index.js";
import { blob, chunk, document, embedding } from "./datatypes/index.js";
import { Plugin } from "./plugin.js";

/** Built-in core plugin that registers the Document, Blob, Chunk, and Embedding datatypes. */
export const corePlugin = Plugin.define("core")
	.withDatatypes(document, blob, chunk, embedding)
	.withActions(chunkSimple, partition);
