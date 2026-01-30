import type { Embedding } from "@nvisy/core";
import type { DistanceMetric } from "#vector/base.js";
import { VectorDatabase } from "#vector/base.js";

/** Credentials for connecting to a Qdrant instance. */
export interface QdrantCredentials {
	/** Qdrant server URL. */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Qdrant-specific configuration. */
export interface QdrantConfig {
	collection: string;
	dimensions?: number;
	distanceMetric?: DistanceMetric;
}

/**
 * Connector for the Qdrant vector database.
 *
 * @example
 * ```ts
 * const qdrant = new QdrantConnector(
 *   { url: "http://localhost:6333" },
 *   { collection: "embeddings" },
 * );
 * await qdrant.connect();
 * ```
 */
export class QdrantConnector extends VectorDatabase<
	QdrantCredentials,
	QdrantConfig
> {
	async connect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async write(_items: Embedding[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
