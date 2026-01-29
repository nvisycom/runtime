import type { RecordData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataInput } from "../../interfaces/data-input.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { Resumable } from "../../interfaces/resumable.js";
import type { RelationalContext } from "../../params/context.js";
import type { RelationalParams } from "../../params/relational.js";

/** Credentials for connecting to PostgreSQL. */
export interface PostgresCredentials {
	/** PostgreSQL connection string. */
	connectionString: string;
}

/** PostgreSQL-specific configuration. */
export interface PostgresConfig extends RelationalParams {}

/**
 * Stub connector for PostgreSQL.
 *
 * Implements both DataInput and DataOutput for relational data.
 */
export class PostgresConnector
	implements
		DataInput<RecordData, RelationalContext>,
		DataOutput<RecordData>,
		Connector<PostgresCredentials, PostgresConfig>
{
	async connect(
		_creds: PostgresCredentials,
		_params: PostgresConfig,
	): Promise<void> {
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
