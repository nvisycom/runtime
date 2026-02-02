/**
 * @module @nvisy/sql
 *
 * SQL provider module for the Nvisy runtime.
 *
 * Exposes Postgres, MySQL, and MSSQL providers (client lifecycle only),
 * read/write streams (keyset-paginated source + batch-insert sink), and
 * row-level transform actions (filter, project, rename, coerce).
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
import { postgres, mysql, mssql } from "./providers/index.js";
import { read, write } from "./streams/index.js";
import { filter, project, rename, coerce } from "./actions/index.js";

/** The SQL module: register this with the runtime to enable all SQL providers, streams, and actions. */
export const sqlModule = Module.define("sql")
	.withProviders(postgres, mysql, mssql)
	.withStreams(read, write)
	.withActions(filter, project, rename, coerce);
