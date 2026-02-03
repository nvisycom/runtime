import { getLogger } from "@logtape/logtape";
import type {
	AnyActionInstance,
	AnyProviderFactory,
	AnyStreamSource,
	AnyStreamTarget,
	ModuleInstance,
} from "@nvisy/core";
import { ValidationError } from "@nvisy/core";

const logger = getLogger(["nvisy", "registry"]);

/**
 * Describes a single registered action for schema generation.
 */
export interface ActionDescriptor {
	readonly name: string;
	readonly configSchema: AnyActionInstance["schema"];
}

/**
 * Describes a single registered provider for schema generation.
 */
export interface ProviderDescriptor {
	readonly name: string;
	readonly credentialSchema: AnyProviderFactory["credentialSchema"];
}

/**
 * Complete snapshot of every action and provider currently registered,
 * suitable for generating an OpenAPI spec alongside the static
 * graph/node/edge schemas.
 */
export interface RegistrySchema {
	readonly actions: ReadonlyArray<ActionDescriptor>;
	readonly providers: ReadonlyArray<ProviderDescriptor>;
}

/**
 * Unified registry that stores providers and actions contributed by
 * {@link ModuleInstance} objects.
 *
 * All entries are keyed as `"moduleId/name"`.
 */
export class Registry {
	readonly #actions = new Map<string, AnyActionInstance>();
	readonly #providers = new Map<string, AnyProviderFactory>();
	readonly #streams = new Map<string, AnyStreamSource | AnyStreamTarget>();
	readonly #modules = new Set<string>();

	/** Snapshot of all registered actions and providers with their schemas. */
	get schema(): RegistrySchema {
		const actions: ActionDescriptor[] = [];
		for (const [name, action] of this.#actions) {
			actions.push({ name, configSchema: action.schema });
		}

		const providers: ProviderDescriptor[] = [];
		for (const [name, factory] of this.#providers) {
			providers.push({ name, credentialSchema: factory.credentialSchema });
		}

		return { actions, providers };
	}

	/** Load all providers, actions, and streams declared by a module. */
	load(mod: ModuleInstance): void {
		this.#ensureNotLoaded(mod.id);
		this.#checkCollisions(mod);

		this.#modules.add(mod.id);

		const providerNames = this.#loadProviders(mod);
		const actionNames = this.#loadActions(mod);
		const streamNames = this.#loadStreams(mod);

		logger.info(`Module loaded: ${mod.id}`, {
			moduleId: mod.id,
			providers: providerNames.join(", "),
			actions: actionNames.join(", "),
			streams: streamNames.join(", "),
		});
	}

	#ensureNotLoaded(moduleId: string): void {
		if (this.#modules.has(moduleId)) {
			throw new ValidationError(`Module already loaded: ${moduleId}`, {
				source: "registry",
				retryable: false,
				details: { moduleId },
			});
		}
	}

	#checkCollisions(mod: ModuleInstance): void {
		const collisions: string[] = [];

		for (const name of Object.keys(mod.providers)) {
			const key = `${mod.id}/${name}`;
			if (this.#providers.has(key)) {
				collisions.push(`provider "${key}"`);
			}
		}

		for (const name of Object.keys(mod.actions)) {
			const key = `${mod.id}/${name}`;
			if (this.#actions.has(key)) {
				collisions.push(`action "${key}"`);
			}
		}

		for (const name of Object.keys(mod.streams)) {
			const key = `${mod.id}/${name}`;
			if (this.#streams.has(key)) {
				collisions.push(`stream "${key}"`);
			}
		}

		if (collisions.length > 0) {
			logger.error(
				"Registry collision loading module {moduleId}: {collisions}",
				{ moduleId: mod.id, collisions: collisions.join(", ") },
			);
			throw new ValidationError(`Registry collision: ${collisions.join(", ")}`, {
				source: "registry",
				retryable: false,
				details: { moduleId: mod.id, collisions },
			});
		}
	}

	#loadProviders(mod: ModuleInstance): string[] {
		const names: string[] = [];
		for (const [name, factory] of Object.entries(mod.providers)) {
			this.#providers.set(`${mod.id}/${name}`, factory);
			names.push(name);
		}
		return names;
	}

	#loadActions(mod: ModuleInstance): string[] {
		const names: string[] = [];
		for (const [name, action] of Object.entries(mod.actions)) {
			this.#actions.set(`${mod.id}/${name}`, action);
			names.push(name);
		}
		return names;
	}

	#loadStreams(mod: ModuleInstance): string[] {
		const names: string[] = [];
		for (const [name, stream] of Object.entries(mod.streams)) {
			this.#streams.set(`${mod.id}/${name}`, stream);
			names.push(name);
		}
		return names;
	}

	/** Look up an action by name. */
	getAction(name: string): AnyActionInstance {
		const action = this.#actions.get(name);
		if (!action) {
			logger.warn(`Action not found: ${name}`, { action: name });
			throw new ValidationError(`Unknown action: ${name}`, {
				source: "registry",
				retryable: false,
				details: { action: name },
			});
		}
		return action;
	}

	/** Look up a provider factory by name. */
	getProvider(name: string): AnyProviderFactory {
		const factory = this.#providers.get(name);
		if (!factory) {
			logger.warn(`Provider not found: ${name}`, { provider: name });
			throw new ValidationError(`Unknown provider: ${name}`, {
				source: "registry",
				retryable: false,
				details: { provider: name },
			});
		}
		return factory;
	}

	/** Look up a stream by name. */
	getStream(name: string): AnyStreamSource | AnyStreamTarget {
		const stream = this.#streams.get(name);
		if (!stream) {
			logger.warn(`Stream not found: ${name}`, { stream: name });
			throw new ValidationError(`Unknown stream: ${name}`, {
				source: "registry",
				retryable: false,
				details: { stream: name },
			});
		}
		return stream;
	}

	/** Look up an action by name, returning undefined if not found. */
	findAction(name: string): AnyActionInstance | undefined {
		return this.#actions.get(name);
	}

	/** Look up a provider factory by name, returning undefined if not found. */
	findProvider(name: string): AnyProviderFactory | undefined {
		return this.#providers.get(name);
	}

	/** Look up a stream by name, returning undefined if not found. */
	findStream(name: string): (AnyStreamSource | AnyStreamTarget) | undefined {
		return this.#streams.get(name);
	}
}
