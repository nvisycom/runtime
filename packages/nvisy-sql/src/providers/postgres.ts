import { PostgresDialect, type Dialect } from "kysely";
import pg from "pg";
import type { SqlCredentials } from "./schemas.js";
import { makeSqlProvider } from "./base.js";

/** Create a PostgreSQL dialect backed by a `pg.Pool`. */
function createDialect(creds: SqlCredentials): Dialect {
	return new PostgresDialect({
		pool: new pg.Pool({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			user: creds.username,
			password: creds.password,
		}),
	});
}

/** PostgreSQL provider. Keyset-paginated source and batch-insert sink via kysely + `pg`. */
export const postgres = makeSqlProvider({ id: "postgres", createDialect });
