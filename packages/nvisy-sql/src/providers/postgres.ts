import { PgClient } from "@effect/sql-pg";
import { Redacted } from "effect";
import { makeSqlProvider } from "./base.js";

/** PostgreSQL provider — keyset-paginated source and batch-insert sink via `@effect/sql-pg`. */
export const postgres = makeSqlProvider({
	id: "postgres",
	makeLayer: (creds) =>
		PgClient.layer({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			username: creds.username,
			password: Redacted.make(creds.password),
		}),
});
