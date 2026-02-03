import { getLogger } from "@logtape/logtape";
import {
	ConnectionError,
	Provider,
	type ProviderFactory,
	type ProviderInstance,
} from "@nvisy/core";
import { type Dialect, Kysely, sql } from "kysely";
import { SqlCredentials } from "./schemas.js";

export type { SqlCredentials } from "./schemas.js";

const logger = getLogger(["nvisy", "sql"]);

/** A database with an unknown schema: any table, any column, unknown values. */
type DynamicDatabase = Record<string, Record<string, unknown>>;

/**
 * Wrapper around a {@link Kysely} instance that serves as the concrete
 * class reference required by {@link StreamFactory.createSource} and
 * {@link StreamFactory.createTarget} for runtime client-type matching.
 *
 * The underlying instance is schema-agnostic ({@link DynamicDatabase})
 * because table structures are not known at compile time.
 */
export class KyselyClient {
	#db: Kysely<DynamicDatabase>;

	constructor(db: Kysely<DynamicDatabase>) {
		this.#db = db;
	}

	/** The underlying Kysely instance used for query building and execution. */
	get db(): Kysely<DynamicDatabase> {
		return this.#db;
	}
}

/** Configuration for {@link makeSqlProvider}. */
export interface SqlProviderConfig {
	/** Unique provider identifier, e.g. `"postgres"`, `"mysql"`, `"mssql"`. */
	readonly id: string;
	/** Build a Kysely {@link Dialect} from validated connection credentials. */
	readonly createDialect: (creds: SqlCredentials) => Dialect;
}

/**
 * Connected SQL provider instance returned by {@link makeSqlProvider}.
 *
 * Holds a {@link KyselyClient} and manages teardown of the underlying
 * Kysely connection pool on {@link disconnect}.
 */
export class SqlProvider implements ProviderInstance<KyselyClient> {
	readonly client: KyselyClient;
	#id: string;

	constructor(client: KyselyClient, id: string) {
		this.client = client;
		this.#id = id;
	}

	async disconnect(): Promise<void> {
		await this.client.db.destroy();
		logger.debug("Disconnected from {provider}", { provider: this.#id });
	}
}

/** Instantiate a Kysely dialect and wrap it in a {@link KyselyClient}. */
function createClient(
	config: SqlProviderConfig,
	credentials: SqlCredentials,
): KyselyClient {
	logger.debug("Connecting to {provider} at {host}:{port}/{database}", {
		provider: config.id,
		host: credentials.host,
		port: credentials.port,
		database: credentials.database,
	});
	return new KyselyClient(
		new Kysely<DynamicDatabase>({ dialect: config.createDialect(credentials) }),
	);
}

/** Run `SELECT 1` to verify the connection is live. */
async function verifyConnection(
	client: KyselyClient,
	config: SqlProviderConfig,
	credentials: SqlCredentials,
): Promise<void> {
	await sql`SELECT 1`.execute(client.db);
	logger.info("Connected to {provider} at {host}:{port}/{database}", {
		provider: config.id,
		host: credentials.host,
		port: credentials.port,
		database: credentials.database,
	});
}

/** Normalise an unknown throw into a {@link ConnectionError}, re-throwing as-is if already one. */
function toConnectionError(error: unknown, source: string): ConnectionError {
	if (error instanceof ConnectionError) return error;
	logger.error("Connection to {provider} failed: {error}", {
		provider: source,
		error: error instanceof Error ? error.message : String(error),
	});
	return new ConnectionError(
		`Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
		{
			source,
			retryable: false,
			cause: error instanceof Error ? error : undefined,
		},
	);
}

/**
 * Create a SQL {@link ProviderFactory} parameterised by a dialect constructor.
 *
 * The returned factory validates {@link SqlCredentials} at parse time, then
 * opens a {@link KyselyClient} on connect and tears it down on disconnect.
 * Actual data I/O is handled by the stream layer, not the provider.
 */
export const makeSqlProvider = (
	config: SqlProviderConfig,
): ProviderFactory<SqlCredentials, KyselyClient> =>
	Provider.withAuthentication(config.id, {
		credentials: SqlCredentials,
		connect: async (credentials) => {
			try {
				const client = createClient(config, credentials);
				await verifyConnection(client, config, credentials);
				return new SqlProvider(client, config.id);
			} catch (error) {
				throw toConnectionError(error, config.id);
			}
		},
	});
