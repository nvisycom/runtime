import { PostgresDialect } from "kysely";
import pg from "pg";
import { makeSqlProvider } from "./base.js";

/** PostgreSQL provider — keyset-paginated source and batch-insert sink via kysely + `pg`. */
export const postgres = makeSqlProvider({
	id: "postgres",
	createDialect: (creds) =>
		new PostgresDialect({
			pool: new pg.Pool({
				host: creds.host,
				port: creds.port,
				database: creds.database,
				user: creds.username,
				password: creds.password,
			}),
		}),
});
