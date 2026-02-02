/**
 * @module @nvisy/core
 *
 * Public API surface for the nvisy core library.
 */

export {
	Data,
	Document,
	Embedding,
	Blob,
	Row,
	DataType,
} from "./datatypes/index.js";
export type { JsonValue, Metadata, DataOptions, DocumentOptions, BlobOptions } from "./datatypes/index.js";

export {
	RuntimeError,
	ConnectionError,
	ValidationError,
	CancellationError,
} from "./errors/index.js";
export type { ErrorContext } from "./errors/index.js";

export type { ProviderInstance, ConnectedInstance, ProviderFactory } from "./providers.js";
export { Provider } from "./providers.js";

export type { Resumable, StreamSource, StreamTarget, WriterFn } from "./streams.js";
export { StreamFactory } from "./streams.js";

export type { ClassRef } from "./types.js";
export type { ActionInstance } from "./actions.js";
export { Action } from "./actions.js";

export type {
	ModuleInstance,
	AnyProviderFactory,
	AnyActionInstance,
	AnyStreamSource,
	AnyStreamTarget,
} from "./module.js";
export { Module } from "./module.js";
