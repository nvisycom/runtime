/** Resumption context for object store reads. */
export interface ObjectContext {
	/** Continuation cursor for listing. */
	cursor?: string;
}

/** Resumption context for relational reads (keyset pagination). */
export interface RelationalContext {
	/** Last-seen cursor value. */
	cursor?: string;
}

/** Resumption context for vector store reads. */
export interface VectorContext {}
