/**
 * @module @nvisy/sql
 *
 * SQL provider module for the Nvisy runtime.
 *
 * Exposes Postgres, MySQL, and MSSQL providers (keyset-paginated source +
 * batch-insert sink) and row-level transform actions (filter, project,
 * rename, coerce).
 *
 * @example
 * ```ts
 * import { sqlModule } from "@nvisy/sql";
 *
 * // Register with the runtime
 * runtime.register(sqlModule);
 * ```
 */

import { Module } from "@nvisy/core";
import { postgres } from "./providers/postgres.js";
import { mysql } from "./providers/mysql.js";
import { mssql } from "./providers/mssql.js";
import { filter } from "./actions/filter.js";
import { project } from "./actions/project.js";
import { rename } from "./actions/rename.js";
import { coerce } from "./actions/coerce.js";

/** The SQL module: register this with the runtime to enable all SQL providers and actions. */
export const sqlModule = Module.Define({
	id: "sql",
	providers: { postgres, mysql, mssql },
	actions: { filter, project, rename, coerce },
});
