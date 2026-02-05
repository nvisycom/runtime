import { getLogger } from "@logtape/logtape";
import { z } from "zod";
import { ConnectionError } from "./errors/index.js";

const logger = getLogger(["nvisy", "provider"]);

/**
 * Configuration for creating a provider that requires credentials.
 *
 * @template TCred - Credential type required for authentication.
 * @template TClient - Client type returned after successful connection.
 */
export interface AuthenticatedProviderConfig<TCred, TClient> {
	/** Zod schema for validating credentials. */
	readonly credentials: z.ZodType<TCred>;
	/** Verify connectivity without establishing a persistent connection. */
	readonly verify?: (credentials: TCred) => Promise<void>;
	/** Factory function that establishes a connection using credentials. */
	readonly connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>;
}

/**
 * Configuration for creating a provider that does not require credentials.
 *
 * @template TClient - Client type returned after successful connection.
 */
export interface UnauthenticatedProviderConfig<TClient> {
	/** Factory function that establishes a connection. */
	readonly connect: () => Promise<ProviderInstance<TClient>>;
}

/**
 * Raw provider instance returned from a connect function.
 *
 * This is the internal representation before wrapping with lifecycle management.
 *
 * @template TClient - Client type provided by this instance.
 */
export interface ProviderInstance<TClient = void> {
	/** The connected client ready for use. */
	readonly client: TClient;
	/** Optional cleanup function called when disconnecting. */
	disconnect?(): Promise<void>;
}

/**
 * A connected provider instance with lifecycle management.
 *
 * Wraps a raw {@link ProviderInstance} with idempotent disconnect handling
 * and logging.
 *
 * @template TClient - Client type provided by this instance.
 */
export interface ConnectedInstance<TClient = void> {
	/** Identifier of the provider that created this instance. */
	readonly id: string;
	/** The connected client ready for use. */
	readonly client: TClient;
	/** Disconnect and release resources (idempotent). */
	disconnect(): Promise<void>;
}

/**
 * Factory for creating provider connections.
 *
 * Providers manage the lifecycle of external clients (databases, APIs, etc.).
 * Each provider defines a credential schema and a connect function that
 * returns a managed {@link ConnectedInstance}.
 *
 * @template TCred - Credential type required for authentication.
 * @template TClient - Client type returned after successful connection.
 */
export interface ProviderFactory<TCred = unknown, TClient = unknown> {
	/** Unique identifier for this provider. */
	readonly id: string;
	/** Zod schema for validating credentials. */
	readonly credentialSchema: z.ZodType<TCred>;
	/** Verify connectivity without establishing a persistent connection. */
	verify(credentials: TCred): Promise<void>;
	/** Create a new connection using the provided credentials. */
	connect(credentials: TCred): Promise<ConnectedInstance<TClient>>;
}

const noop = async () => {};

class ConnectedInstanceImpl<TClient> implements ConnectedInstance<TClient> {
	readonly id: string;
	readonly client: TClient;
	readonly #disconnect: () => Promise<void>;
	#disconnected = false;

	constructor(id: string, instance: ProviderInstance<TClient>) {
		this.id = id;
		this.client = instance.client;
		this.#disconnect = instance.disconnect ?? noop;
	}

	async disconnect(): Promise<void> {
		if (this.#disconnected) return;
		this.#disconnected = true;

		try {
			await this.#disconnect();
			logger.debug("Provider disconnected", { provider: this.id });
		} catch (error) {
			logger.warn("Provider disconnect failed", {
				provider: this.id,
				error: String(error),
			});
			throw error;
		}
	}
}

class ProviderFactoryImpl<TCred, TClient>
	implements ProviderFactory<TCred, TClient>
{
	readonly id: string;
	readonly credentialSchema: z.ZodType<TCred>;
	readonly #connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>;
	readonly #verify: (credentials: TCred) => Promise<void>;

	constructor(
		id: string,
		credentialSchema: z.ZodType<TCred>,
		connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>,
		verify?: (credentials: TCred) => Promise<void>,
	) {
		this.id = id;
		this.credentialSchema = credentialSchema;
		this.#connect = connect;
		this.#verify = verify ?? noop;
	}

	async verify(credentials: TCred): Promise<void> {
		await this.#verify(credentials);
	}

	async connect(credentials: TCred): Promise<ConnectedInstance<TClient>> {
		try {
			const instance = await this.#connect(credentials);
			logger.debug("Provider connected", { provider: this.id });
			return new ConnectedInstanceImpl(this.id, instance);
		} catch (error) {
			logger.warn("Provider connection failed", {
				provider: this.id,
				error: error instanceof Error ? error.message : String(error),
			});
			if (error instanceof ConnectionError) throw error;
			throw new ConnectionError(
				error instanceof Error ? error.message : String(error),
				{ source: this.id, cause: error instanceof Error ? error : undefined },
			);
		}
	}
}

/** Factory for creating provider definitions. */
export const Provider = {
	/**
	 * Create a provider that requires authentication credentials.
	 *
	 * @param id - Unique identifier for the provider.
	 * @param config - Provider configuration including credential schema and connect function.
	 */
	withAuthentication<TClient, TCred>(
		id: string,
		config: AuthenticatedProviderConfig<TCred, TClient>,
	): ProviderFactory<TCred, TClient> {
		return new ProviderFactoryImpl(
			id,
			config.credentials,
			config.connect,
			config.verify,
		);
	},

	/**
	 * Create a provider that does not require authentication.
	 *
	 * @param id - Unique identifier for the provider.
	 * @param config - Provider configuration including connect function.
	 */
	withoutAuthentication<TClient>(
		id: string,
		config: UnauthenticatedProviderConfig<TClient>,
	): ProviderFactory<void, TClient> {
		return new ProviderFactoryImpl(id, z.void(), () => config.connect());
	},
};
