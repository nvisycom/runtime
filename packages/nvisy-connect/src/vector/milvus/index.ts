import type { EmbeddingData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { VectorParams } from "../../params/vector.js";

/** Credentials for connecting to a Milvus instance. */
export interface MilvusCredentials {
	/** Milvus server address (host:port). */
	address: string;
	/** Optional authentication token. */
	token?: string;
}

/** Milvus-specific configuration. */
export interface MilvusConfig extends VectorParams {}

/**
 * Stub connector for Milvus vector database.
 *
 * Implements DataOutput only -- vector DBs are output-only.
 */
export class MilvusConnector
	implements
		DataOutput<EmbeddingData>,
		Connector<MilvusCredentials, MilvusConfig>
{
	async connect(
		_creds: MilvusCredentials,
		_params: MilvusConfig,
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
