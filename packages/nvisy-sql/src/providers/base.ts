import { Kysely, sql, type Dialect } from "kysely";
import { getLogger } from "@logtape/logtape";
import { Provider, ConnectionError } from "@nvisy/core";
import { SqlCredentials } from "./schemas.js";
export type { SqlCredentials } from "./schemas.js";

const logger = getLogger(["nvisy", "sql"]);

/**
 * Wrapper around a {@link Kysely} instance that provides a concrete class
 * reference for runtime client-type verification.
 */
export class KyselyClient {
	readonly db: Kysely<any>;
	constructor(db: Kysely<any>) {
		this.db = db;
	}
}

/**
 * Create a SQL provider factory parameterised by a dialect constructor.
 *
 * The provider only manages the client lifecycle (connect/disconnect).
 * Streams handle reading/writing separately.
 */
export const makeSqlProvider = (config: {
	id: string;
	createDialect: (creds: SqlCredentials) => Dialect;
}) =>
	Provider.withAuthentication(config.id, {
		credentials: SqlCredentials,
		connect: async (credentials) => {
			logger.debug("Connecting to {provider} at {host}:{port}/{database}", {
				provider: config.id,
				host: credentials.host,
				port: credentials.port,
				database: credentials.database,
			});
			try {
				const db = new Kysely<any>({ dialect: config.createDialect(credentials) });
				await sql`SELECT 1`.execute(db);
				logger.info("Connected to {provider} at {host}:{port}/{database}", {
					provider: config.id,
					host: credentials.host,
					port: credentials.port,
					database: credentials.database,
				});
				return {
					client: new KyselyClient(db),
					disconnect: async () => {
						await db.destroy();
						logger.debug("Disconnected from {provider}", { provider: config.id });
					},
				};
			} catch (error) {
				logger.error("Connection to {provider} failed: {error}", {
					provider: config.id,
					error: error instanceof Error ? error.message : String(error),
				});
				if (error instanceof ConnectionError) throw error;
				throw new ConnectionError(
					`Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
					{ source: config.id, retryable: false, cause: error instanceof Error ? error : undefined },
				);
			}
		},
	});
