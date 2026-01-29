/** Distance metric used for vector similarity search. */
export enum DistanceMetric {
	Cosine = "cosine",
	Euclidean = "euclidean",
	DotProduct = "dot_product",
}

/** Configuration parameters for a vector store connector. */
export interface VectorParams {
	/** Name of the collection / index. */
	collection: string;
	/** Vector dimensionality (optional, some stores infer it). */
	dimensions?: number;
	/** Distance metric to use for similarity search. */
	distanceMetric?: DistanceMetric;
}
