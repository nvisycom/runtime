/**
 * @module provider-types
 *
 * Defines the interfaces for the Provider concept — the external
 * client/connection lifecycle layer.
 *
 * A provider manages a single concern: connecting to an external
 * system and producing a typed client handle. It does not read or
 * write data — that is the responsibility of {@link StreamSource}
 * and {@link StreamTarget}.
 *
 * ## Relationship to Streams and Actions
 *
 * ```
 * Provider.connect(creds) → ProviderInstance { client }
 *                                  │
 *              ┌───────────────────┼───────────────────┐
 *              ▼                   ▼                   ▼
 *     StreamSource.read()   StreamTarget.write()   Action.execute()
 *        (client, ...)         (client, ...)       (client, ...)
 * ```
 *
 * Streams and actions declare a client type (`TClient`) that constrains
 * which providers they are compatible with. The runtime matches them
 * at graph compilation time.
 */

import type { Schema } from "effect";

// ── Callback types ───────────────────────────────────────────────────

/**
 * Async callback that establishes a connection to an external system
 * and returns a {@link ProviderInstance}.
 */
export type ConnectFn<TCred, TClient> = (credentials: TCred) => Promise<ProviderInstance<TClient>>;

// ── Config types ─────────────────────────────────────────────────────

/**
 * Configuration for {@link Provider.withAuthentication}.
 *
 * @typeParam TCred   - Credential type validated by {@link credentials}.
 * @typeParam TClient - Client type produced on connect.
 */
export interface AuthenticatedProviderConfig<TCred, TClient> {
	/** Effect Schema for validating credentials at graph compile time. */
	readonly credentials: Schema.Schema<TCred>;
	/** Async callback that connects to the external system. */
	readonly connect: ConnectFn<TCred, TClient>;
}

/**
 * Configuration for {@link Provider.withoutAuthentication}.
 *
 * @typeParam TClient - Client type.
 */
export interface UnauthenticatedProviderConfig<TClient> {
	/** Async callback that produces the client without requiring credentials. */
	readonly connect: () => Promise<ProviderInstance<TClient>>;
}

// ── Instance & factory interfaces ────────────────────────────────────

/**
 * A connected provider instance — holds a live client and knows how
 * to tear it down.
 *
 * Returned by connect callbacks in provider configs and by
 * {@link ProviderFactory.connect}. Call {@link disconnect} when the
 * execution completes to release pooled connections, file handles, etc.
 *
 * @typeParam TClient - The client type this provider produces
 *                      (e.g. `SqlRuntime`, `LanguageModel`).
 *
 * @example
 * ```ts
 * // In a connect callback (disconnect is optional):
 * connect: async (creds) => ({ client: await createPool(creds) })
 *
 * // From factory.connect() — returns ConnectedInstance (id + disconnect guaranteed):
 * const instance = await factory.connect(creds);
 * console.log(instance.id); // "postgres"
 * try { ... } finally { await instance.disconnect(); }
 * ```
 */
export interface ProviderInstance<TClient = void> {
	/** The live client handle for interacting with the external system. */
	readonly client: TClient;

	/**
	 * Release resources held by this provider instance.
	 *
	 * Optional when returned from a connect callback — the factory
	 * guarantees a no-op fallback. Always present on the value
	 * returned by {@link ProviderFactory.connect}.
	 */
	disconnect?(): Promise<void>;
}

/**
 * A fully resolved provider instance returned by {@link ProviderFactory.connect}.
 *
 * Extends {@link ProviderInstance} with:
 * - `id` — the factory identifier, so the caller knows which provider it came from.
 * - `disconnect` — always present (no-op fallback when the callback omits it).
 */
export interface ConnectedInstance<TClient = void> extends Required<ProviderInstance<TClient>> {
	/** Provider identifier — matches the factory's {@link ProviderFactory.id}. */
	readonly id: string;
}

/**
 * Factory that creates {@link ProviderInstance} values from credentials.
 *
 * Each concrete provider (e.g. `sql/postgres`, `ai/openai`) implements
 * this interface. The runtime stores factories in the registry and
 * calls {@link connect} at graph execution time.
 *
 * @typeParam TCred   - Credential type required to connect
 *                      (validated by {@link credentialSchema}).
 * @typeParam TClient - The client type produced on successful connect.
 *
 * @example
 * ```ts
 * const factory: ProviderFactory<SqlCredentials, SqlRuntime> =
 *   Provider.withAuthentication("postgres", {
 *     credentials: SqlCredentials,
 *     connect: async (creds) => ({
 *       client: await createPool(creds),
 *       disconnect: () => pool.end(),
 *     }),
 *   });
 * ```
 */
export interface ProviderFactory<TCred = unknown, TClient = unknown> {
	/** Unique identifier for this provider factory (e.g. `"postgres"`, `"openai"`). */
	readonly id: string;

	/** Effect Schema for validating credentials at graph compile time. */
	readonly credentialSchema: Schema.Schema<TCred>;

	/**
	 * Connect to the external system and return a live provider instance.
	 *
	 * The returned instance always has `disconnect` defined (no-op fallback
	 * when the connect callback omits it).
	 *
	 * @param credentials - Validated credentials for the connection.
	 * @returns A connected provider instance holding the client handle.
	 * @throws {ConnectionError} When the connection cannot be established.
	 */
	connect(credentials: TCred): Promise<ConnectedInstance<TClient>>;
}
