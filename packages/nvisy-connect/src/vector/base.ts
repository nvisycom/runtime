import type { Embedding, Metadata } from "@nvisy/core";
import type { DataOutput } from "#core/stream.js";
import { Provider } from "#core/provider.js";

// ── Distance metric ─────────────────────────────────────────────────

/**
 * Distance metric used for vector similarity search.
 *
 * Use as a value (`DistanceMetric.Cosine`) or as a type
 * (`DistanceMetric`) for the union of all metric strings.
 */
export const DistanceMetric = {
	Cosine: "cosine",
	Euclidean: "euclidean",
	DotProduct: "dot_product",
} as const;

export type DistanceMetric =
	(typeof DistanceMetric)[keyof typeof DistanceMetric];

// ── Vector params ───────────────────────────────────────────────────

/** Configuration parameters for a vector store connector. */
export interface VectorParams {
	/** Name of the collection / index. */
	collection: string;
	/** Vector dimensionality (optional — some stores infer it). */
	dimensions?: number;
	/** Distance metric to use for similarity search. */
	distanceMetric?: DistanceMetric;
}

/** Resumption context for vector store reads. */
export interface VectorContext {}

// ── Base class ──────────────────────────────────────────────────────

/**
 * Abstract base class for vector database connectors.
 *
 * Vector databases are write-only sinks — they receive embeddings from the
 * pipeline and store them for later similarity search.
 *
 * Extends {@link Provider} to store credentials and configuration.
 * Subclasses implement the storage and connection logic for a specific
 * backend (pgvector, Pinecone, Qdrant, etc.).
 */
export abstract class VectorDatabase<
	TCred,
	TConfig extends VectorParams = VectorParams,
> extends Provider<TCred, TConfig>
	implements DataOutput<Embedding>
{
	abstract write(items: Embedding[]): Promise<void>;
}

// ── Search types ────────────────────────────────────────────────────

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
	/** Ordered list of scored results (highest score first). */
	results: ScoredResult[];
	/** Total number of matches (may exceed `results.length`). */
	total: number;
}
