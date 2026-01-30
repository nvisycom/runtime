import type { RecordData } from "@nvisy/core";
import type { Resumable } from "#core/resumable.js";
import { RelationalDatabase } from "#relational/base.js";
import type { RelationalContext } from "#relational/base.js";

/** Credentials for connecting to PostgreSQL. */
export interface PostgresCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** PostgreSQL-specific configuration. */
export interface PostgresConfig {
	table: string;
	schema?: string;
	batchSize?: number;
}

/**
 * Connector for PostgreSQL relational databases.
 *
 * @example
 * ```ts
 * const pg = new PostgresConnector(
 *   { connectionString: "postgresql://..." },
 *   { table: "documents", schema: "public" },
 * );
 * await pg.connect();
 * ```
 */
export class PostgresConnector extends RelationalDatabase<
	PostgresCredentials,
	PostgresConfig
> {
	async connect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async *read(
		_ctx: RelationalContext,
	): AsyncIterable<Resumable<RecordData, RelationalContext>> {
		throw new Error("Not yet implemented");
	}

	async write(_items: RecordData[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
