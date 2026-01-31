import { Context, Effect, Layer, Metric } from "effect";
import type { ModuleInstance, AnyProviderFactory, AnyActionInstance } from "@nvisy/core";

// ── Metrics ────────────────────────────────────────────────────────────

const modulesLoaded = Metric.counter("registry.modules_loaded", {
	description: "Total number of modules loaded into the registry",
});

const actionsRegistered = Metric.counter("registry.actions_registered", {
	description: "Total number of actions registered via modules",
});

const providersRegistered = Metric.counter("registry.providers_registered", {
	description: "Total number of providers registered via modules",
});

const actionLookups = Metric.counter("registry.action_lookups", {
	description: "Total action lookup attempts",
});

const actionMisses = Metric.counter("registry.action_misses", {
	description: "Action lookups that failed with unknown name",
});

const providerLookups = Metric.counter("registry.provider_lookups", {
	description: "Total provider lookup attempts",
});

const providerMisses = Metric.counter("registry.provider_misses", {
	description: "Provider lookups that failed with unknown name",
});

// ── Schema descriptor ──────────────────────────────────────────────────

/**
 * Describes a single registered action for schema generation.
 */
export interface ActionDescriptor {
	readonly name: string;
	/** The Effect Schema attached to the underlying ActionInstance. */
	readonly configSchema: AnyActionInstance["schema"];
}

/**
 * Describes a single registered provider for schema generation.
 */
export interface ProviderDescriptor {
	readonly name: string;
	readonly credentialSchema: AnyProviderFactory["credentialSchema"];
	readonly paramSchema: AnyProviderFactory["paramSchema"];
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

// ── Registry service ───────────────────────────────────────────────────

/**
 * Unified registry that stores providers and actions contributed by
 * {@link ModuleInstance} objects.
 *
 * All entries are keyed as `"moduleId/name"`.
 */
export class Registry extends Context.Tag("@nvisy/Registry")<
	Registry,
	{
		/** Load all providers and actions declared by a module. */
		readonly loadModule: (mod: ModuleInstance) => Effect.Effect<void, Error>;

		/** Look up an action by name. */
		readonly getAction: (name: string) => Effect.Effect<AnyActionInstance, Error>;

		/** Look up a provider factory by name. */
		readonly getProvider: (name: string) => Effect.Effect<AnyProviderFactory, Error>;

		/** List all registered action names. */
		readonly listActions: () => Effect.Effect<ReadonlyArray<string>>;

		/** List all registered provider names. */
		readonly listProviders: () => Effect.Effect<ReadonlyArray<string>>;

		/** List IDs of all loaded modules. */
		readonly listModules: () => Effect.Effect<ReadonlyArray<string>>;

		/**
		 * Return a snapshot of every action and provider currently
		 * registered, with their Effect Schemas attached.
		 */
		readonly describe: () => Effect.Effect<RegistrySchema>;
	}
>() {
	static Live = Layer.sync(Registry, () => {
		const actions = new Map<string, AnyActionInstance>();
		const providers = new Map<string, AnyProviderFactory>();
		const modules = new Set<string>();

		return {
			loadModule: (mod) =>
				Effect.gen(function* () {
					if (modules.has(mod.id)) {
						return yield* Effect.fail(
							new Error(`Module already loaded: ${mod.id}`),
						);
					}

					const collisions: string[] = [];

					for (const name of Object.keys(mod.providers)) {
						const key = `${mod.id}/${name}`;
						if (providers.has(key)) {
							collisions.push(`provider "${key}"`);
						}
					}
					for (const name of Object.keys(mod.actions)) {
						const key = `${mod.id}/${name}`;
						if (actions.has(key)) {
							collisions.push(`action "${key}"`);
						}
					}
					if (collisions.length > 0) {
						return yield* Effect.fail(
							new Error(`Registry collision: ${collisions.join(", ")}`),
						);
					}

					modules.add(mod.id);

					const providerNames = Object.keys(mod.providers);
					for (const [name, factory] of Object.entries(mod.providers)) {
						providers.set(`${mod.id}/${name}`, factory);
					}

					const actionNames = Object.keys(mod.actions);
					for (const [name, action] of Object.entries(mod.actions)) {
						actions.set(`${mod.id}/${name}`, action);
					}

					yield* Metric.increment(modulesLoaded);
					yield* Metric.incrementBy(providersRegistered, providerNames.length);
					yield* Metric.incrementBy(actionsRegistered, actionNames.length);
					yield* Effect.log(`Module loaded: ${mod.id}`)
						.pipe(Effect.annotateLogs({
							moduleId: mod.id,
							providers: providerNames.join(", "),
							actions: actionNames.join(", "),
						}));
				}),

			getAction: (name) =>
				Effect.gen(function* () {
					yield* Metric.increment(actionLookups);
					const action = actions.get(name);
					if (!action) {
						yield* Metric.increment(actionMisses);
						yield* Effect.logWarning(`Action not found: ${name}`)
							.pipe(Effect.annotateLogs({ action: name }));
						return yield* Effect.fail(new Error(`Unknown action: ${name}`));
					}
					return action;
				}),

			getProvider: (name) =>
				Effect.gen(function* () {
					yield* Metric.increment(providerLookups);
					const factory = providers.get(name);
					if (!factory) {
						yield* Metric.increment(providerMisses);
						yield* Effect.logWarning(`Provider not found: ${name}`)
							.pipe(Effect.annotateLogs({ provider: name }));
						return yield* Effect.fail(new Error(`Unknown provider: ${name}`));
					}
					return factory;
				}),

			listActions: () => Effect.sync(() => [...actions.keys()]),
			listProviders: () => Effect.sync(() => [...providers.keys()]),
			listModules: () => Effect.sync(() => [...modules]),

			describe: () =>
				Effect.sync(() => {
					const actionDescriptors: ActionDescriptor[] = [];
					for (const [name, action] of actions) {
						actionDescriptors.push({
							name,
							configSchema: action.schema,
						});
					}

					const providerDescriptors: ProviderDescriptor[] = [];
					for (const [name, factory] of providers) {
						providerDescriptors.push({
							name,
							credentialSchema: factory.credentialSchema,
							paramSchema: factory.paramSchema,
						});
					}

					return {
						actions: actionDescriptors,
						providers: providerDescriptors,
					};
				}),
		};
	});
}
