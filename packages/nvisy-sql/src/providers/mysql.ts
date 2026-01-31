import { MysqlClient } from "@effect/sql-mysql2";
import { Redacted } from "effect";
import { makeSqlProvider } from "../shared/sql-provider.js";

export const mysql = makeSqlProvider({
	id: "mysql",
	makeLayer: (creds) =>
		MysqlClient.layer({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			username: creds.username,
			password: Redacted.make(creds.password),
		}),
});
