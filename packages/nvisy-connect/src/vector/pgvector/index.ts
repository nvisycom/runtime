import type { EmbeddingData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { VectorParams } from "../../params/vector.js";

export { setupSchema } from "./migrations.js";
export { semanticSearch } from "./search.js";

/** Credentials for connecting to PostgreSQL with pgvector. */
export interface PgVectorCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** pgvector-specific configuration. */
export interface PgVectorConfig extends VectorParams {}

/**
 * Stub connector for PostgreSQL with the pgvector extension.
 *
 * Implements DataOutput only -- vector DBs are output-only.
 */
export class PgVectorConnector
	implements
		DataOutput<EmbeddingData>,
		Connector<PgVectorCredentials, PgVectorConfig>
{
	async connect(
		_creds: PgVectorCredentials,
		_params: PgVectorConfig,
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
