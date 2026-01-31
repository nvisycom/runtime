import { Module } from "@nvisy/core";
import { postgres } from "./providers/postgres.js";
import { mysql } from "./providers/mysql.js";
import { mssql } from "./providers/mssql.js";

export const sqlModule = Module.Define({
	id: "sql",
	providers: { postgres, mysql, mssql },
});
