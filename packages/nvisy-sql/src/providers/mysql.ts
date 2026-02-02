import { MysqlDialect } from "kysely";
import { createPool } from "mysql2/promise";
import { makeSqlProvider } from "./base.js";

/** MySQL provider — keyset-paginated source and batch-insert sink via kysely + `mysql2`. */
export const mysql = makeSqlProvider({
	id: "mysql",
	createDialect: (creds) =>
		new MysqlDialect({
			pool: createPool({
				host: creds.host,
				port: creds.port,
				database: creds.database,
				user: creds.username,
				password: creds.password,
			}),
		}),
});
