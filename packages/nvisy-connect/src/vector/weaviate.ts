import type { EmbeddingData } from "@nvisy/core";
import type { Connector } from "../interfaces/connector.js";
import type { DataOutput } from "../interfaces/data-output.js";
import type { VectorParams } from "../params/vector.js";

/** Credentials for connecting to a Weaviate instance. */
export interface WeaviateCredentials {
	/** Weaviate server URL. */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Weaviate-specific configuration. */
export interface WeaviateConfig extends VectorParams {}

/**
 * Stub connector for Weaviate vector database.
 *
 * Implements DataOutput only -- vector DBs are output-only.
 */
export class WeaviateConnector
	implements
		DataOutput<EmbeddingData>,
		Connector<WeaviateCredentials, WeaviateConfig>
{
	async connect(
		_creds: WeaviateCredentials,
		_params: WeaviateConfig,
	): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async write(_items: EmbeddingData[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
