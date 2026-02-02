/**
 * @module providers
 *
 * The Provider concept — the external client/connection lifecycle layer.
 */

import { getLogger } from "@logtape/logtape";
import { z } from "zod";
import { ConnectionError } from "./errors/index.js";

const logger = getLogger(["nvisy", "provider"]);

export interface AuthenticatedProviderConfig<TCred, TClient> {
	readonly credentials: z.ZodType<TCred>;
	readonly connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>;
}

export interface UnauthenticatedProviderConfig<TClient> {
	readonly connect: () => Promise<ProviderInstance<TClient>>;
}

export interface ProviderInstance<TClient = void> {
	readonly client: TClient;
	disconnect?(): Promise<void>;
}

export interface ConnectedInstance<TClient = void> {
	readonly id: string;
	readonly client: TClient;
	disconnect(): Promise<void>;
}

export interface ProviderFactory<TCred = unknown, TClient = unknown> {
	readonly id: string;
	readonly credentialSchema: z.ZodType<TCred>;
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

class ProviderFactoryImpl<TCred, TClient> implements ProviderFactory<TCred, TClient> {
	readonly id: string;
	readonly credentialSchema: z.ZodType<TCred>;
	readonly #connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>;

	constructor(
		id: string,
		credentialSchema: z.ZodType<TCred>,
		connect: (credentials: TCred) => Promise<ProviderInstance<TClient>>,
	) {
		this.id = id;
		this.credentialSchema = credentialSchema;
		this.#connect = connect;
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

export const Provider = {
	withAuthentication<TClient, TCred>(
		id: string,
		config: AuthenticatedProviderConfig<TCred, TClient>,
	): ProviderFactory<TCred, TClient> {
		return new ProviderFactoryImpl(id, config.credentials, config.connect);
	},

	withoutAuthentication<TClient>(
		id: string,
		config: UnauthenticatedProviderConfig<TClient>,
	): ProviderFactory<void, TClient> {
		return new ProviderFactoryImpl(id, z.void(), () => config.connect());
	},
};
