import type { EmbeddingData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { VectorParams } from "../../params/vector.js";

/** Credentials for connecting to Pinecone. */
export interface PineconeCredentials {
	/** Pinecone API key. */
	apiKey: string;
	/** Pinecone environment (e.g. "us-east-1-aws"). */
	environment: string;
}

/** Pinecone-specific configuration. */
export interface PineconeConfig extends VectorParams {}

/**
 * Stub connector for Pinecone vector database.
 *
 * Implements DataOutput only -- vector DBs are output-only.
 */
export class PineconeConnector
	implements
		DataOutput<EmbeddingData>,
		Connector<PineconeCredentials, PineconeConfig>
{
	async connect(
		_creds: PineconeCredentials,
		_params: PineconeConfig,
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
