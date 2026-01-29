import type { RecordData } from "@nvisy/core";
import type { Connector } from "../interfaces/connector.js";
import type { DataInput } from "../interfaces/data-input.js";
import type { DataOutput } from "../interfaces/data-output.js";
import type { Resumable } from "../interfaces/resumable.js";
import type { RelationalContext } from "../params/context.js";
import type { RelationalParams } from "../params/relational.js";

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
export interface MySQLConfig extends RelationalParams {}

/**
 * Stub connector for MySQL.
 *
 * Implements both DataInput and DataOutput for relational data.
 */
export class MySQLConnector
	implements
		DataInput<RecordData, RelationalContext>,
		DataOutput<RecordData>,
		Connector<MySQLCredentials, MySQLConfig>
{
	async connect(_creds: MySQLCredentials, _params: MySQLConfig): Promise<void> {
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
