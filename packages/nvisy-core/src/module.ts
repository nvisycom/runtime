/**
 * @module module
 *
 * Defines the {@link ModuleInstance} interface and the {@link Module}
 * factory namespace for grouping related providers, streams, and actions
 * into a single registerable unit.
 *
 * A module is the primary distribution mechanism for nvisy capabilities.
 * Each module packages a cohesive set of functionality — for example,
 * the `sql` module bundles database providers (`postgres`, `mysql`),
 * stream sources/targets (`read`, `write`), and pure actions (`filter`,
 * `project`, `rename`, `coerce`).
 *
 * The runtime's registry loads modules and indexes their contents
 * under the module's `id` prefix:
 *
 * ```
 * Module "sql"
 *   ├── providers: { postgres, mysql, mssql }  → sql/postgres, sql/mysql, sql/mssql
 *   ├── streams:   { read, write }             → sql/read, sql/write
 *   └── actions:   { filter, project, ... }    → sql/filter, sql/project, ...
 * ```
 *
 * @example
 * ```ts
 * import { Module } from "@nvisy/core";
 *
 * export const sqlModule = Module.define("sql")
 *   .withProviders(postgres, mysql, mssql)
 *   .withStreams(read, write)
 *   .withActions(filter, project, rename, coerce);
 * ```
 */

import type { Data } from "#datatypes/base-datatype.js";
import type { DataType } from "#datatypes/index.js";
import type { ProviderFactory } from "#providers/provider-types.js";
import type { ActionInstance } from "#actions/action-types.js";
import type { StreamSource, StreamTarget } from "#streams/stream-types.js";

/**
 * Type-erased {@link ProviderFactory} for use in module registries
 * where the concrete credential and client types are not known.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProviderFactory = ProviderFactory<any, any>;

/**
 * Type-erased {@link ActionInstance} for use in module registries
 * where the concrete client, data, and parameter types are not known.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyActionInstance = ActionInstance<any, Data, Data, any>;

/**
 * Type-erased {@link StreamSource} for use in module registries
 * where the concrete client, data, context, and parameter types are not known.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStreamSource = StreamSource<any, DataType, any, any>;

/**
 * Type-erased {@link StreamTarget} for use in module registries
 * where the concrete client, data, and parameter types are not known.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStreamTarget = StreamTarget<any, DataType, any>;

/**
 * A registered module — groups related providers, streams, and actions
 * under a common namespace.
 *
 * When a module is loaded into the runtime registry, each entry is
 * prefixed with the module's {@link id}. For example, a module with
 * `id: "sql"` and `actions: { filter }` registers the action as
 * `"sql/filter"`.
 *
 * @example
 * ```ts
 * const mod: ModuleInstance = Module.define("sql")
 *   .withProviders(postgresFactory)
 *   .withStreams(sqlReadSource, sqlWriteTarget)
 *   .withActions(filterAction, projectAction);
 * ```
 */
export interface ModuleInstance {
	/** Unique namespace identifier for this module (e.g. `"sql"`, `"ai"`). */
	readonly id: string;

	/** Provider factories keyed by local name (e.g. `{ postgres, mysql }`). */
	readonly providers: Readonly<Record<string, AnyProviderFactory>>;

	/** Stream sources and targets keyed by local name (e.g. `{ read, write }`). */
	readonly streams: Readonly<Record<string, AnyStreamSource | AnyStreamTarget>>;

	/** Actions keyed by local name (e.g. `{ filter, project, rename }`). */
	readonly actions: Readonly<Record<string, AnyActionInstance>>;
}

/**
 * Internal builder class for creating {@link ModuleInstance} values.
 */
class ModuleBuilder implements ModuleInstance {
	readonly id: string;
	readonly providers: Readonly<Record<string, AnyProviderFactory>> = {};
	readonly streams: Readonly<Record<string, AnyStreamSource | AnyStreamTarget>> = {};
	readonly actions: Readonly<Record<string, AnyActionInstance>> = {};

	constructor(id: string) {
		this.id = id;
	}

	withProviders(...providers: AnyProviderFactory[]): this {
		const record = { ...this.providers };
		for (const p of providers) record[p.id] = p;
		(this as { providers: typeof record }).providers = record;
		return this;
	}

	withStreams(...streams: (AnyStreamSource | AnyStreamTarget)[]): this {
		const record = { ...this.streams };
		for (const s of streams) record[s.id] = s;
		(this as { streams: typeof record }).streams = record;
		return this;
	}

	withActions(...actions: AnyActionInstance[]): this {
		const record = { ...this.actions };
		for (const a of actions) record[a.id] = a;
		(this as { actions: typeof record }).actions = record;
		return this;
	}
}

/**
 * Factory namespace for creating {@link ModuleInstance} values.
 *
 * @example
 * ```ts
 * const sqlModule = Module.define("sql")
 *   .withProviders(postgres, mysql, mssql)
 *   .withStreams(read, write)
 *   .withActions(filter, project, rename, coerce);
 * ```
 */
export const Module = {
	/**
	 * Create a new module builder with the given namespace ID.
	 *
	 * Chain `.withProviders(...)`, `.withStreams(...)`, and
	 * `.withActions(...)` to populate the module.
	 *
	 * @param id - Unique namespace identifier (e.g. `"sql"`, `"ai"`).
	 */
	define(id: string): ModuleBuilder {
		return new ModuleBuilder(id);
	},
} as const;
