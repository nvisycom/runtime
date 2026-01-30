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
