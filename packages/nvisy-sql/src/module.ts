import { Module } from "@nvisy/core";
import { postgres } from "./providers/postgres.js";
import { mysql } from "./providers/mysql.js";
import { mssql } from "./providers/mssql.js";
import { filter } from "./actions/filter.js";
import { project } from "./actions/project.js";
import { rename } from "./actions/rename.js";
import { coerce } from "./actions/coerce.js";

export const sqlModule = Module.Define({
	id: "sql",
	providers: { postgres, mysql, mssql },
	actions: { filter, project, rename, coerce },
});
