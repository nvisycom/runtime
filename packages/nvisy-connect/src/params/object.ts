/** Configuration parameters for an object store connector. */
export interface ObjectParams {
	/** Bucket or container name. */
	bucket: string;
	/** Key prefix to scope operations (optional). */
	prefix?: string;
	/** Whether to list objects recursively. */
	recursive?: boolean;
}
