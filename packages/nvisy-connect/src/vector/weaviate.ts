import type { EmbeddingData } from "@nvisy/core";
import type { DistanceMetric } from "#vector/base.js";
import { VectorDatabase } from "#vector/base.js";

/** Credentials for connecting to a Weaviate instance. */
export interface WeaviateCredentials {
	/** Weaviate server URL. */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Weaviate-specific configuration. */
export interface WeaviateConfig {
	collection: string;
	dimensions?: number;
	distanceMetric?: DistanceMetric;
}

/**
 * Connector for the Weaviate vector database.
 *
 * @example
 * ```ts
 * const weaviate = new WeaviateConnector(
 *   { url: "http://localhost:8080" },
 *   { collection: "embeddings" },
 * );
 * await weaviate.connect();
 * ```
 */
export class WeaviateConnector extends VectorDatabase<
	WeaviateCredentials,
	WeaviateConfig
> {
	async connect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async write(_items: EmbeddingData[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
