import { getLogger } from "@logtape/logtape";
import type {
	AnyActionInstance,
	AnyProviderFactory,
	ModuleInstance,
} from "@nvisy/core";

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
	readonly #modules = new Set<string>();

	/** Load all providers and actions declared by a module. */
	loadModule(mod: ModuleInstance): void {
		if (this.#modules.has(mod.id)) {
			throw new Error(`Module already loaded: ${mod.id}`);
		}

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
		if (collisions.length > 0) {
			logger.error(
				"Registry collision loading module {moduleId}: {collisions}",
				{
					moduleId: mod.id,
					collisions: collisions.join(", "),
				},
			);
			throw new Error(`Registry collision: ${collisions.join(", ")}`);
		}

		this.#modules.add(mod.id);

		const providerNames = Object.keys(mod.providers);
		for (const [name, factory] of Object.entries(mod.providers)) {
			this.#providers.set(`${mod.id}/${name}`, factory);
		}

		const actionNames = Object.keys(mod.actions);
		for (const [name, action] of Object.entries(mod.actions)) {
			this.#actions.set(`${mod.id}/${name}`, action);
		}

		logger.info(`Module loaded: ${mod.id}`, {
			moduleId: mod.id,
			providers: providerNames.join(", "),
			actions: actionNames.join(", "),
		});
	}

	/** Look up an action by name. */
	getAction(name: string): AnyActionInstance {
		const action = this.#actions.get(name);
		if (!action) {
			logger.warn(`Action not found: ${name}`, { action: name });
			throw new Error(`Unknown action: ${name}`);
		}
		return action;
	}

	/** Look up a provider factory by name. */
	getProvider(name: string): AnyProviderFactory {
		const factory = this.#providers.get(name);
		if (!factory) {
			logger.warn(`Provider not found: ${name}`, { provider: name });
			throw new Error(`Unknown provider: ${name}`);
		}
		return factory;
	}

	/** List all registered action names. */
	listActions(): ReadonlyArray<string> {
		return [...this.#actions.keys()];
	}

	/** List all registered provider names. */
	listProviders(): ReadonlyArray<string> {
		return [...this.#providers.keys()];
	}

	/** List IDs of all loaded modules. */
	listModules(): ReadonlyArray<string> {
		return [...this.#modules];
	}

	/**
	 * Return a snapshot of every action and provider currently
	 * registered, with their schemas attached.
	 */
	describe(): RegistrySchema {
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
}
