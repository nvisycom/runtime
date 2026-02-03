import { type Dialect, MssqlDialect } from "kysely";
import * as Tarn from "tarn";
import * as Tedious from "tedious";
import { makeSqlProvider } from "./base.js";
import type { SqlCredentials } from "./schemas.js";

/** Create a `tedious` {@link Tedious.Connection} from credentials. */
function createConnection(creds: SqlCredentials): Tedious.Connection {
	return new Tedious.Connection({
		server: creds.host,
		authentication: {
			options: {
				userName: creds.username,
				password: creds.password,
			},
			type: "default",
		},
		options: {
			database: creds.database,
			port: creds.port,
			trustServerCertificate: true,
		},
	});
}

/** Create an MSSQL dialect backed by `tedious` with a `tarn` connection pool. */
function createDialect(creds: SqlCredentials): Dialect {
	return new MssqlDialect({
		tarn: {
			...Tarn,
			options: { min: 0, max: 10 },
		},
		tedious: {
			...Tedious,
			connectionFactory: () => createConnection(creds),
		},
	});
}

/** Microsoft SQL Server provider. Keyset-paginated source and batch-insert sink via kysely + `tedious`. */
export const mssql = makeSqlProvider({ id: "mssql", createDialect });
