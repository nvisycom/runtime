import type { Metadata } from "@nvisy/core";

/** Options for a vector similarity search. */
export interface SearchOptions {
	/** Query vector. */
	query: number[];
	/** Maximum number of results to return. */
	topK: number;
	/** Minimum similarity score threshold. */
	minScore?: number;
	/** Optional metadata filter. */
	filter?: Record<string, unknown>;
}

/** A single scored result from a similarity search. */
export interface ScoredResult {
	/** Unique identifier of the matched vector. */
	id: string;
	/** Similarity score. */
	score: number;
	/** Optional metadata attached to the vector. */
	metadata?: Metadata;
}

/** Wrapper for a list of scored search results. */
export interface SearchResult {
	/** Ordered list of scored results. */
	results: ScoredResult[];
	/** Total number of matches (may exceed results.length). */
	total: number;
}
