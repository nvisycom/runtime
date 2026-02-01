import { MysqlClient } from "@effect/sql-mysql2";
import { Redacted } from "effect";
import { makeSqlProvider } from "../shared/sql-provider.js";

/** MySQL provider — keyset-paginated source and batch-insert sink via `@effect/sql-mysql2`. */
export const mysql = makeSqlProvider({
	id: "sql/mysql",
	makeLayer: (creds) =>
		MysqlClient.layer({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			username: creds.username,
			password: Redacted.make(creds.password),
		}),
});
