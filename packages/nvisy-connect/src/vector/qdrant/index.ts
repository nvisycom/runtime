import type { EmbeddingData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { VectorParams } from "../../params/vector.js";

/** Credentials for connecting to a Qdrant instance. */
export interface QdrantCredentials {
	/** Qdrant server URL. */
	url: string;
	/** Optional API key. */
	apiKey?: string;
}

/** Qdrant-specific configuration. */
export interface QdrantConfig extends VectorParams {}

/**
 * Stub connector for Qdrant vector database.
 *
 * Implements DataOutput only -- vector DBs are output-only.
 */
export class QdrantConnector
	implements
		DataOutput<EmbeddingData>,
		Connector<QdrantCredentials, QdrantConfig>
{
	async connect(
		_creds: QdrantCredentials,
		_params: QdrantConfig,
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
