import { getLogger } from "@logtape/logtape";
import type {
	AnyActionInstance,
	AnyProviderFactory,
	AnyStreamSource,
	AnyStreamTarget,
	Datatype,
	PluginInstance,
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
 * {@link PluginInstance} objects.
 *
 * All entries are keyed as `"pluginId/name"`.
 */
export class Registry {
	readonly #actions = new Map<string, AnyActionInstance>();
	readonly #providers = new Map<string, AnyProviderFactory>();
	readonly #streams = new Map<string, AnyStreamSource | AnyStreamTarget>();
	readonly #datatypes = new Map<string, Datatype>();
	readonly #plugins = new Set<string>();

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

	/** Load all providers, actions, and streams declared by a plugin. */
	load(plugin: PluginInstance): void {
		this.#ensureNotLoaded(plugin.id);
		this.#checkCollisions(plugin);

		this.#plugins.add(plugin.id);

		const providerNames = this.#loadProviders(plugin);
		const actionNames = this.#loadActions(plugin);
		const streamNames = this.#loadStreams(plugin);
		const datatypeNames = this.#loadDatatypes(plugin);

		logger.info(`Plugin loaded: ${plugin.id}`, {
			pluginId: plugin.id,
			providers: providerNames.join(", "),
			actions: actionNames.join(", "),
			streams: streamNames.join(", "),
			datatypes: datatypeNames.join(", "),
		});
	}

	#ensureNotLoaded(pluginId: string): void {
		if (this.#plugins.has(pluginId)) {
			throw new ValidationError(`Plugin already loaded: ${pluginId}`, {
				source: "registry",
				retryable: false,
				details: { pluginId },
			});
		}
	}

	#checkCollisions(plugin: PluginInstance): void {
		const collisions: string[] = [];

		for (const name of Object.keys(plugin.providers)) {
			const key = `${plugin.id}/${name}`;
			if (this.#providers.has(key)) {
				collisions.push(`provider "${key}"`);
			}
		}

		for (const name of Object.keys(plugin.actions)) {
			const key = `${plugin.id}/${name}`;
			if (this.#actions.has(key)) {
				collisions.push(`action "${key}"`);
			}
		}

		for (const name of Object.keys(plugin.streams)) {
			const key = `${plugin.id}/${name}`;
			if (this.#streams.has(key)) {
				collisions.push(`stream "${key}"`);
			}
		}

		for (const name of Object.keys(plugin.datatypes)) {
			const key = `${plugin.id}/${name}`;
			if (this.#datatypes.has(key)) {
				collisions.push(`datatype "${key}"`);
			}
		}

		if (collisions.length > 0) {
			logger.error(
				"Registry collision loading plugin {pluginId}: {collisions}",
				{ pluginId: plugin.id, collisions: collisions.join(", ") },
			);
			throw new ValidationError(
				`Registry collision: ${collisions.join(", ")}`,
				{
					source: "registry",
					retryable: false,
					details: { pluginId: plugin.id, collisions },
				},
			);
		}
	}

	#loadProviders(plugin: PluginInstance): string[] {
		const names: string[] = [];
		for (const [name, factory] of Object.entries(plugin.providers)) {
			this.#providers.set(`${plugin.id}/${name}`, factory);
			names.push(name);
		}
		return names;
	}

	#loadActions(plugin: PluginInstance): string[] {
		const names: string[] = [];
		for (const [name, action] of Object.entries(plugin.actions)) {
			this.#actions.set(`${plugin.id}/${name}`, action);
			names.push(name);
		}
		return names;
	}

	#loadStreams(plugin: PluginInstance): string[] {
		const names: string[] = [];
		for (const [name, stream] of Object.entries(plugin.streams)) {
			this.#streams.set(`${plugin.id}/${name}`, stream);
			names.push(name);
		}
		return names;
	}

	#loadDatatypes(plugin: PluginInstance): string[] {
		const names: string[] = [];
		for (const [name, entry] of Object.entries(plugin.datatypes)) {
			this.#datatypes.set(`${plugin.id}/${name}`, entry);
			names.push(name);
		}
		return names;
	}

	/** Look up an action by name. */
	getAction(name: string): AnyActionInstance {
		const action = this.#actions.get(name);
		if (!action) {
			logger.warn(`Action not found: ${name}`, { action: name });
			throw ValidationError.notFound(name, "action", "registry");
		}
		return action;
	}

	/** Look up a provider factory by name. */
	getProvider(name: string): AnyProviderFactory {
		const factory = this.#providers.get(name);
		if (!factory) {
			logger.warn(`Provider not found: ${name}`, { provider: name });
			throw ValidationError.notFound(name, "provider", "registry");
		}
		return factory;
	}

	/** Look up a stream by name. */
	getStream(name: string): AnyStreamSource | AnyStreamTarget {
		const stream = this.#streams.get(name);
		if (!stream) {
			logger.warn(`Stream not found: ${name}`, { stream: name });
			throw ValidationError.notFound(name, "stream", "registry");
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

	/** Look up a data type by name. */
	getDataType(name: string): Datatype {
		const entry = this.#datatypes.get(name);
		if (!entry) {
			logger.warn(`Data type not found: ${name}`, { datatype: name });
			throw ValidationError.notFound(name, "datatype", "registry");
		}
		return entry;
	}

	/** Look up a data type by name, returning undefined if not found. */
	findDataType(name: string): Datatype | undefined {
		return this.#datatypes.get(name);
	}
}
