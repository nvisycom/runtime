/**
 * A sink that accepts batches of data items of type `T`.
 *
 * Connectors that support writing (e.g. vector databases, relational
 * databases) implement this interface.
 *
 * @typeParam T - The data type accepted by the output.
 */
export interface DataOutput<T> {
	/** Write a batch of items to the destination. */
	write(items: T[]): Promise<void>;
}
