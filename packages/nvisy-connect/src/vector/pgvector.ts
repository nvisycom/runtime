import type { EmbeddingData } from "@nvisy/core";
import type { DistanceMetric } from "#core/params.js";
import { VectorDatabase } from "#vector/base.js";
import type { SearchOptions, SearchResult } from "#vector/base.js";

/** Credentials for connecting to PostgreSQL with pgvector. */
export interface PgVectorCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** pgvector-specific configuration. */
export interface PgVectorConfig {
	collection: string;
	dimensions?: number;
	distanceMetric?: DistanceMetric;
}

/**
 * Connector for PostgreSQL with the pgvector extension.
 *
 * @example
 * ```ts
 * const pgv = new PgVectorConnector(
 *   { connectionString: "postgresql://..." },
 *   { collection: "embeddings", dimensions: 1536 },
 * );
 * await pgv.connect();
 * ```
 */
export class PgVectorConnector extends VectorDatabase<
	PgVectorCredentials,
	PgVectorConfig
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

/**
 * Run schema setup / migrations for the pgvector extension and
 * embedding storage table.
 *
 * @param _connectionString - PostgreSQL connection string.
 * @param _table - Target table name.
 * @param _dimension - Vector dimensionality.
 */
export async function setupSchema(
	_connectionString: string,
	_table: string,
	_dimension: number,
): Promise<void> {
	throw new Error("Not yet implemented");
}

/**
 * Perform a semantic similarity search against a pgvector table.
 *
 * @param _options - Search parameters.
 * @returns Scored search results.
 */
export async function semanticSearch(
	_options: SearchOptions,
): Promise<SearchResult> {
	throw new Error("Not yet implemented");
}
