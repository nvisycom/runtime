/**
 * @module @nvisy/core
 *
 * Public API surface for the nvisy core library.
 *
 * Re-exports all user-facing types and factory namespaces organised
 * into five groups:
 *
 * - **Data types** — {@link Data}, {@link Document}, {@link Embedding},
 *   {@link Blob}, {@link Row}, {@link DataType}.
 * - **Errors** — {@link RuntimeError}, {@link ConnectionError},
 *   {@link ValidationError}, {@link CancellationError}.
 * - **Providers** — {@link Provider}, {@link ProviderInstance},
 *   {@link ProviderFactory}.
 * - **Streams** — {@link Stream}, {@link StreamSource},
 *   {@link StreamTarget}, {@link Resumable}.
 * - **Actions** — {@link Action}, {@link ActionInstance}.
 * - **Modules** — {@link Module}, {@link ModuleInstance}.
 */

export {
	Data,
	Document,
	Embedding,
	Blob,
	Row,
	DataType,
} from "#datatypes/index.js";
export type { JsonValue, Metadata, DataOptions, DocumentOptions, BlobOptions } from "#datatypes/index.js";

export {
	RuntimeError,
	ConnectionError,
	ValidationError,
	CancellationError,
} from "#errors/index.js";
export type { ErrorContext } from "#errors/index.js";

export type { ProviderInstance, ConnectedInstance, ProviderFactory } from "#providers/index.js";
export { Provider } from "#providers/index.js";

export type { Resumable, StreamSource, StreamTarget } from "#streams/index.js";
export { Stream } from "#streams/index.js";

export type { ClassRef, ActionInstance } from "#actions/index.js";
export { Action } from "#actions/index.js";

export type {
	ModuleInstance,
	AnyProviderFactory,
	AnyActionInstance,
	AnyStreamSource,
	AnyStreamTarget,
} from "#module.js";
export { Module } from "#module.js";
