import type { ProviderFactory } from "./providers.js";
import type { ActionInstance } from "./actions.js";
import type { StreamSource, StreamTarget } from "./streams.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProviderFactory = ProviderFactory<any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyActionInstance = ActionInstance<any, any, any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStreamSource = StreamSource<any, any, any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStreamTarget = StreamTarget<any, any, any>;

export interface ModuleInstance {
	readonly id: string;
	readonly providers: Readonly<Record<string, AnyProviderFactory>>;
	readonly streams: Readonly<Record<string, AnyStreamSource | AnyStreamTarget>>;
	readonly actions: Readonly<Record<string, AnyActionInstance>>;
}

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

export const Module = {
	define(id: string): ModuleBuilder {
		return new ModuleBuilder(id);
	},
} as const;
