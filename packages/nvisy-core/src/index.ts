/**
 * @module @nvisy/core
 *
 * Public API surface for the nvisy core library.
 */

export type { ActionInstance } from "./action.js";
export { Action } from "./action.js";
export type {
	Datatype,
	DocumentElement,
	DocumentOptions,
	DocumentPage,
	DocumentSection,
	ElementType,
	JsonValue,
	Metadata,
} from "./datatypes/index.js";
export {
	Blob,
	blobDatatype,
	Data,
	Datatypes,
	Document,
	documentDatatype,
	Embedding,
	embeddingDatatype,
} from "./datatypes/index.js";
export type { ErrorContext } from "./errors/index.js";
export {
	CancellationError,
	ConnectionError,
	RuntimeError,
	ValidationError,
} from "./errors/index.js";
export type {
	LoaderConfig,
	LoaderInstance,
	LoadFn,
	PlaintextParams,
} from "./loaders/index.js";
export {
	Loader,
	plaintextLoader,
	plaintextParamsSchema,
} from "./loaders/index.js";
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
export type { ClassRef } from "./types.js";

import {
	blobDatatype,
	documentDatatype,
	embeddingDatatype,
} from "./datatypes/index.js";
import { plaintextLoader } from "./loaders/index.js";
import { Plugin } from "./plugin.js";

/** Built-in core plugin that registers the Document, Blob, and Embedding datatypes, and plaintext loader. */
export const corePlugin = Plugin.define("core")
	.withDatatypes(documentDatatype, blobDatatype, embeddingDatatype)
	.withLoaders(plaintextLoader);
