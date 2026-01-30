import type { Embedding } from "@nvisy/core";
import type { DistanceMetric } from "#vector/base.js";
import { VectorDatabase } from "#vector/base.js";

/** Credentials for connecting to Pinecone. */
export interface PineconeCredentials {
	/** Pinecone API key. */
	apiKey: string;
	/** Pinecone environment (e.g. `"us-east-1-aws"`). */
	environment: string;
}

/** Pinecone-specific configuration. */
export interface PineconeConfig {
	collection: string;
	dimensions?: number;
	distanceMetric?: DistanceMetric;
}

/**
 * Connector for the Pinecone vector database.
 *
 * @example
 * ```ts
 * const pinecone = new PineconeConnector(
 *   { apiKey: "...", environment: "us-east-1-aws" },
 *   { collection: "embeddings" },
 * );
 * await pinecone.connect();
 * ```
 */
export class PineconeConnector extends VectorDatabase<
	PineconeCredentials,
	PineconeConfig
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
