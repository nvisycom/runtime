import { type Dialect, MysqlDialect } from "kysely";
import { createPool } from "mysql2/promise";
import { makeSqlProvider } from "./client.js";
import type { SqlCredentials } from "./schemas.js";

/** Create a MySQL dialect backed by a `mysql2` connection pool. */
function createDialect(creds: SqlCredentials): Dialect {
	return new MysqlDialect({
		pool: createPool({
			host: creds.host,
			port: creds.port,
			database: creds.database,
			user: creds.username,
			password: creds.password,
		}),
	});
}

/** MySQL provider. Keyset-paginated source and batch-insert sink via kysely + `mysql2`. */
export const mysql = makeSqlProvider({ id: "mysql", createDialect });
