import { PgClient } from "@effect/sql-pg";
import { Redacted } from "effect";
import { makeSqlProvider } from "../shared/sql-provider.js";

/** PostgreSQL provider — keyset-paginated source and batch-insert sink via `@effect/sql-pg`. */
export const postgres = makeSqlProvider({
	id: "sql/postgres",
	makeLayer: (creds) =>
		PgClient.layer({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			username: creds.username,
			password: Redacted.make(creds.password),
		}),
});
