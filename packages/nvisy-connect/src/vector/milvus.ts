import type { Embedding } from "@nvisy/core";
import type { DistanceMetric } from "#vector/base.js";
import { VectorDatabase } from "#vector/base.js";

/** Credentials for connecting to a Milvus instance. */
export interface MilvusCredentials {
	/** Milvus server address (`host:port`). */
	address: string;
	/** Optional authentication token. */
	token?: string;
}

/** Milvus-specific configuration. */
export interface MilvusConfig {
	collection: string;
	dimensions?: number;
	distanceMetric?: DistanceMetric;
}

/**
 * Connector for the Milvus vector database.
 *
 * @example
 * ```ts
 * const milvus = new MilvusConnector(
 *   { address: "localhost:19530" },
 *   { collection: "embeddings" },
 * );
 * await milvus.connect();
 * ```
 */
export class MilvusConnector extends VectorDatabase<
	MilvusCredentials,
	MilvusConfig
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
