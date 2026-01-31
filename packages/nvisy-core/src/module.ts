import type { Data } from "#datatypes/base-datatype.js";
import type { ProviderFactory } from "#providers/provider-types.js";
import type { ActionInstance } from "#actions/base-action.js";

/**
 * A type-erased provider factory entry.
 *
 * Uses `any` for credential/param types because Effect `Schema` is
 * invariant — `Schema<T>` is not assignable to `Schema<unknown>`.
 * This is the deliberate erasure boundary; concrete types are
 * recovered via the schemas at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProviderFactory = ProviderFactory<any, any>;

/**
 * A type-erased action instance entry.
 *
 * Uses `any` for the param type for the same invariance reason
 * as {@link AnyProviderFactory}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyActionInstance = ActionInstance<Data, Data, any>;

/**
 * A module groups related providers and actions under a common name.
 *
 * Packages such as `@nvisy/sql` or `@nvisy/ai` use {@link Module.Define}
 * to declare everything they contribute. The runtime can then discover
 * and register these declarations without knowing the concrete types.
 *
 * Items are stored as records keyed by the registration name the runtime
 * will use (e.g. `"postgres"`, `"mysql"`).  When loaded into the registry
 * the final key becomes `"moduleId/name"`.
 */
export interface ModuleInstance {
	readonly id: string;
	readonly providers: Readonly<Record<string, AnyProviderFactory>>;
	readonly actions: Readonly<Record<string, AnyActionInstance>>;
}

export const Module = {
	/**
	 * Declare a module with its providers and actions.
	 *
	 * @example
	 * ```ts
	 * export const SqlModule = Module.Define({
	 *   id: "sql",
	 *   providers: { postgres: PostgresProvider, mysql: MySqlProvider },
	 *   actions: { filter: SqlFilter, map: SqlMap },
	 * });
	 * ```
	 */
	Define(config: {
		id: string;
		providers?: Readonly<Record<string, AnyProviderFactory>>;
		actions?: Readonly<Record<string, AnyActionInstance>>;
	}): ModuleInstance {
		return {
			id: config.id,
			providers: config.providers ?? {},
			actions: config.actions ?? {},
		};
	},
} as const;
