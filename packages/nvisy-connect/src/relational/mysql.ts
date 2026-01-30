import type { RecordData } from "@nvisy/core";
import type { Resumable } from "#core/stream.js";
import { RelationalDatabase } from "#relational/base.js";
import type { RelationalContext } from "#relational/base.js";

/** Credentials for connecting to MySQL. */
export interface MySQLCredentials {
	/** Database server host. */
	host: string;
	/** Database server port. */
	port: number;
	/** Database user. */
	user: string;
	/** Database password. */
	password: string;
	/** Database name. */
	database: string;
}

/** MySQL-specific configuration. */
export interface MySQLConfig {
	table: string;
	schema?: string;
	batchSize?: number;
}

/**
 * Connector for MySQL relational databases.
 *
 * @example
 * ```ts
 * const mysql = new MySQLConnector(
 *   { host: "localhost", port: 3306, user: "root", password: "...", database: "mydb" },
 *   { table: "documents" },
 * );
 * await mysql.connect();
 * ```
 */
export class MySQLConnector extends RelationalDatabase<
	MySQLCredentials,
	MySQLConfig
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
