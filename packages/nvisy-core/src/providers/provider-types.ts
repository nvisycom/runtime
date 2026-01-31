import type { Schema } from "effect";
import type { DataType } from "#datatypes/index.js";
import type { DataSource, DataSink } from "#providers/stream-types.js";

/**
 * A connected provider instance.
 *
 * @typeParam TData - The concrete pipeline data type this provider works with.
 */
export interface ProviderInstance<TData extends DataType = DataType> {
	readonly id: string;
	readonly dataClass: abstract new (...args: never[]) => TData;
	disconnect?(): Promise<void>;
}

/**
 * A provider instance that can produce a {@link DataSource} for reading.
 *
 * @typeParam TData - Data type yielded by the source.
 * @typeParam TCtx  - Resumption context carried alongside each item.
 */
export interface SourceProvider<
	TData extends DataType = DataType,
	TCtx = void,
> {
	readonly contextSchema: Schema.Schema<TCtx>;
	createSource(): DataSource<TData, TCtx>;
}

/**
 * A provider instance that can produce a {@link DataSink} for writing.
 *
 * @typeParam TData - Data type accepted by the sink.
 */
export interface SinkProvider<TData extends DataType = DataType> {
	createSink(): DataSink<TData>;
}

/**
 * Static-side interface for a provider factory.
 *
 * Holds the schemas needed to validate connection inputs and
 * the async {@link connect} method that creates provider instances.
 *
 * @typeParam TCred  - Credential / connection-info type required to connect.
 * @typeParam TParam - Parameter type forwarded during connection.
 * @typeParam T      - The concrete provider instance type returned by {@link connect}.
 */
export interface ProviderFactory<
	TCred = unknown,
	TParam = unknown,
	T extends ProviderInstance = ProviderInstance,
> {
	readonly credentialSchema: Schema.Schema<TCred>;
	readonly paramSchema: Schema.Schema<TParam>;
	connect(credentials: TCred, params: TParam): Promise<T>;
}
