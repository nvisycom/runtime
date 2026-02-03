import type { ActionInstance } from "./actions.js";
import type { ProviderFactory } from "./providers.js";
import type { StreamSource, StreamTarget } from "./streams.js";

// biome-ignore lint/suspicious/noExplicitAny: existential type alias
export type AnyProviderFactory = ProviderFactory<any, any>;

// biome-ignore lint/suspicious/noExplicitAny: existential type alias
export type AnyActionInstance = ActionInstance<any, any, any, any>;

// biome-ignore lint/suspicious/noExplicitAny: existential type alias
export type AnyStreamSource = StreamSource<any, any, any, any>;

// biome-ignore lint/suspicious/noExplicitAny: existential type alias
export type AnyStreamTarget = StreamTarget<any, any, any>;

/**
 * A module bundles providers, streams, and actions under a namespace.
 *
 * Modules are the unit of registration with the engine. All entries
 * are namespaced as `"moduleId/name"` to avoid collisions.
 */
export interface ModuleInstance {
	/** Unique identifier for the module (e.g. "sql", "openai"). */
	readonly id: string;
	/** Provider factories keyed by their ID. */
	readonly providers: Readonly<Record<string, AnyProviderFactory>>;
	/** Stream sources and targets keyed by their ID. */
	readonly streams: Readonly<Record<string, AnyStreamSource | AnyStreamTarget>>;
	/** Actions keyed by their ID. */
	readonly actions: Readonly<Record<string, AnyActionInstance>>;
}

class ModuleBuilder implements ModuleInstance {
	readonly id: string;
	readonly providers: Readonly<Record<string, AnyProviderFactory>> = {};
	readonly streams: Readonly<
		Record<string, AnyStreamSource | AnyStreamTarget>
	> = {};
	readonly actions: Readonly<Record<string, AnyActionInstance>> = {};

	constructor(id: string) {
		this.id = id;
	}

	/** Add providers to this module. */
	withProviders(...providers: AnyProviderFactory[]): this {
		const record = { ...this.providers };
		for (const p of providers) record[p.id] = p;
		(this as { providers: typeof record }).providers = record;
		return this;
	}

	/** Add streams to this module. */
	withStreams(...streams: (AnyStreamSource | AnyStreamTarget)[]): this {
		const record = { ...this.streams };
		for (const s of streams) record[s.id] = s;
		(this as { streams: typeof record }).streams = record;
		return this;
	}

	/** Add actions to this module. */
	withActions(...actions: AnyActionInstance[]): this {
		const record = { ...this.actions };
		for (const a of actions) record[a.id] = a;
		(this as { actions: typeof record }).actions = record;
		return this;
	}
}

/** Factory for creating module definitions. */
export const Module = {
	/** Create a new module with the given ID. */
	define(id: string): ModuleBuilder {
		return new ModuleBuilder(id);
	},
} as const;
