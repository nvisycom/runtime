import { MssqlDialect } from "kysely";
import * as Tedious from "tedious";
import * as Tarn from "tarn";
import { makeSqlProvider } from "./base.js";

/** Microsoft SQL Server provider — keyset-paginated source and batch-insert sink via kysely + `tedious`. */
export const mssql = makeSqlProvider({
	id: "mssql",
	createDialect: (creds) =>
		new MssqlDialect({
			tarn: {
				...Tarn,
				options: { min: 0, max: 10 },
			},
			tedious: {
				...Tedious,
				connectionFactory: () =>
					new Tedious.Connection({
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
					}),
			},
		}),
});
