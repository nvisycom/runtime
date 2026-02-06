import { getLogger } from "@logtape/logtape";
import pg from "pg";
import pgvector from "pgvector";
import { z } from "zod";
import {
	makeVectorProvider,
	type UpsertVector,
	VectorClient,
	VectorProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "vector"]);

/**
 * Credentials for connecting to PostgreSQL with pgvector.
 */
export const PgvectorCredentials = z.object({
	/** PostgreSQL connection string (e.g. `"postgresql://user:pass@host/db"`). */
	connectionString: z.string(),
	/** Table name to store vectors in. */
	tableName: z.string(),
});
export type PgvectorCredentials = z.infer<typeof PgvectorCredentials>;

class PgVectorClient extends VectorClient {
	readonly #pool: pg.Pool;
	readonly #tableName: string;

	constructor(pool: pg.Pool, tableName: string) {
		super();
		this.#pool = pool;
		this.#tableName = tableName;
	}

	async upsert(vectors: UpsertVector[]): Promise<void> {
		const client = await this.#pool.connect();
		try {
			for (const v of vectors) {
				const embedding = pgvector.toSql([...v.vector]);
				await client.query(
					`INSERT INTO ${this.#tableName} (id, embedding, metadata)
					 VALUES ($1, $2, $3)
					 ON CONFLICT (id) DO UPDATE SET embedding = $2, metadata = $3`,
					[v.id, embedding, JSON.stringify(v.metadata ?? {})],
				);
			}
		} finally {
			client.release();
		}
	}
}

/** PostgreSQL + pgvector provider. */
export const pgvectorProvider = makeVectorProvider(
	"pgvector",
	PgvectorCredentials,
	async (creds) => {
		logger.debug("Connecting to pgvector table {tableName}", {
			tableName: creds.tableName,
		});

		const pool = new pg.Pool({ connectionString: creds.connectionString });
		await pool.query("CREATE EXTENSION IF NOT EXISTS vector");

		return new VectorProvider(
			new PgVectorClient(pool, creds.tableName),
			"pgvector",
			async () => {
				await pool.end();
			},
		);
	},
);
