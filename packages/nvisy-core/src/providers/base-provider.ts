/**
 * @module base-provider
 *
 * Provides the {@link Provider} factory namespace for creating
 * {@link ProviderFactory} and {@link ProviderInstance} implementations.
 *
 * Two factory methods cover the common cases:
 *
 * - {@link Provider.withAuthentication} — for providers that connect to an
 *   external system using credentials (databases, APIs, etc.).
 * - {@link Provider.withoutAuthentication} — for providers that need no
 *   credentials and produce an immediate client.
 *
 * @example
 * ```ts
 * // Database provider
 * const postgres = Provider.withAuthentication("postgres", {
 *   credentials: SqlCredentials,
 *   connect: async (creds) => {
 *     const pool = await createPool(creds);
 *     return { client: pool, disconnect: () => pool.end() };
 *   },
 * });
 *
 * // No-credential provider
 * const local = Provider.withoutAuthentication("local", {
 *   connect: async () => ({ client: new InMemoryCache() }),
 * });
 * ```
 */

import { Schema } from "effect";
import type {
	ProviderInstance,
	ConnectedInstance,
	ProviderFactory,
	AuthenticatedProviderConfig,
	UnauthenticatedProviderConfig,
} from "#providers/provider-types.js";

const noop = () => Promise.resolve();

/** Build a {@link ConnectedInstance} from a factory id and user-returned instance. */
function makeConnected<TClient>(id: string, instance: ProviderInstance<TClient>): ConnectedInstance<TClient> {
	return { id, client: instance.client, disconnect: instance.disconnect ?? noop };
}

/**
 * Factory namespace for creating {@link ProviderFactory} values.
 *
 * Prefer these factories over manual object construction — they
 * guarantee proper class instances with encapsulated internals.
 */
export const Provider = {
	/**
	 * Create a provider factory that connects to an external system
	 * using validated credentials.
	 *
	 * @typeParam TClient - Client type produced on connect.
	 * @param id - Unique provider identifier (e.g. `"postgres"`).
	 * @param config - Provider configuration.
	 * @param config.credentials - Effect Schema for validating credentials.
	 * @param config.connect - Async callback that produces the client.
	 *
	 * @example
	 * ```ts
	 * const postgres = Provider.withAuthentication("postgres", {
	 *   credentials: SqlCredentials,
	 *   connect: async (creds) => {
	 *     const runtime = await connectRuntime(creds);
	 *     return { client: runtime, disconnect: () => runtime.dispose() };
	 *   },
	 * });
	 * ```
	 */
	withAuthentication<TClient, TCred>(
		id: string,
		config: AuthenticatedProviderConfig<TCred, TClient>,
	): ProviderFactory<TCred, TClient> {
		return {
			id,
			credentialSchema: config.credentials,
			connect: async (credentials) => makeConnected(id, await config.connect(credentials)),
		};
	},

	/**
	 * Create a provider factory that requires no credentials.
	 *
	 * Useful for:
	 * - In-process services that don't need external connections.
	 * - Test doubles and mock providers.
	 *
	 * The credential schema is `Schema.Void` and `connect()` delegates
	 * to the provided callback each time it is called.
	 *
	 * @typeParam TClient - Client type.
	 * @param id - Unique provider identifier.
	 * @param config - Provider configuration.
	 * @param config.connect - Async callback that produces the client.
	 *
	 * @example
	 * ```ts
	 * const cached = Provider.withoutAuthentication("cache", {
	 *   connect: async () => ({ client: new InMemoryCache() }),
	 * });
	 * ```
	 */
	withoutAuthentication<TClient>(
		id: string,
		config: UnauthenticatedProviderConfig<TClient>,
	): ProviderFactory<void, TClient> {
		return {
			id,
			credentialSchema: Schema.Void,
			connect: async () => makeConnected(id, await config.connect()),
		};
	},
};
