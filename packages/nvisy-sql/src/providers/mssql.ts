import { MssqlClient } from "@effect/sql-mssql";
import { Redacted } from "effect";
import { makeSqlProvider } from "../shared/sql-provider.js";

export const mssql = makeSqlProvider({
	id: "sql/mssql",
	makeLayer: (creds) =>
		MssqlClient.layer({
			server: creds.host,
			port: creds.port,
			database: creds.database,
			username: creds.username,
			password: Redacted.make(creds.password),
		}),
});
