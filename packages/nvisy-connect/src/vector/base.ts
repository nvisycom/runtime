import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect";
import type { Embedding } from "@nvisy/core";
import type { ConnectionError, StorageError } from "@nvisy/core";
import type { DataOutput } from "#core/stream.js";

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

// ── Error type ──────────────────────────────────────────────────────

/** Errors that may occur during vector operations. */
export type VectorError = ConnectionError | StorageError;

// ── Service interface ───────────────────────────────────────────────

/**
 * Service interface for vector database connectors.
 *
 * Vector databases are write-only sinks — they receive embeddings from the
 * pipeline and store them. The connect/disconnect lifecycle is managed by
 * the Layer.
 */
export interface VectorDatabase extends DataOutput<Embedding, VectorError> {}

// ── Context.Tag ─────────────────────────────────────────────────────

/** Effect service tag for vector database access. */
export class VectorDb extends Context.Tag("@nvisy/connect/VectorDb")<
	VectorDb,
	VectorDatabase
>() {}

// ── Layer factory ───────────────────────────────────────────────────

/**
 * Create a Layer that provides a {@link VectorDatabase} service.
 *
 * The `connect` function should use `Effect.acquireRelease` to pair
 * connection establishment with teardown.
 */
export const makeVectorLayer = <TCred>(config: {
	readonly creds: TCred;
	readonly params: VectorParams;
	readonly connect: (
		creds: TCred,
		params: VectorParams,
	) => Effect.Effect<VectorDatabase, ConnectionError, Scope.Scope>;
}): Layer.Layer<VectorDb, ConnectionError> =>
	Layer.scoped(VectorDb, config.connect(config.creds, config.params));
