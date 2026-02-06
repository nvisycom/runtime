import { getLogger } from "@logtape/logtape";
import {
	Provider,
	type ProviderFactory,
	type ProviderInstance,
} from "@nvisy/core";
import type { z } from "zod";

const logger = getLogger(["nvisy", "object"]);

/**
 * Result of listing objects under a prefix.
 */
export interface ListResult {
	/** Object keys returned in this page. */
	readonly keys: string[];
	/** Opaque cursor for fetching the next page, or `undefined` if exhausted. */
	readonly nextCursor?: string;
}

/**
 * Abstract client that object-store streams use for I/O.
 *
 * Each provider (S3, GCS, Azure) supplies a concrete subclass.
 * The class reference is required by {@link Stream.createSource} and
 * {@link Stream.createTarget} for runtime client-type matching.
 */
export abstract class ObjectStoreClient {
	/** List object keys under `prefix`, optionally resuming from `cursor`. */
	abstract list(prefix: string, cursor?: string): Promise<ListResult>;

	/** Retrieve a single object by key. */
	abstract get(key: string): Promise<{ data: Buffer; contentType?: string }>;

	/** Write a single object by key. */
	abstract put(key: string, data: Buffer, contentType?: string): Promise<void>;
}

/**
 * Connected object-store provider instance.
 *
 * Holds an {@link ObjectStoreClient} and manages teardown on
 * {@link disconnect}.
 */
export class ObjectStoreProvider
	implements ProviderInstance<ObjectStoreClient>
{
	readonly client: ObjectStoreClient;
	readonly #id: string;
	readonly #disconnect: (() => Promise<void>) | undefined;

	constructor(
		client: ObjectStoreClient,
		id: string,
		disconnect?: () => Promise<void>,
	) {
		this.client = client;
		this.#id = id;
		this.#disconnect = disconnect;
	}

	async disconnect(): Promise<void> {
		await this.#disconnect?.();
		logger.debug("Disconnected from {provider}", { provider: this.#id });
	}
}

/**
 * Create an object-store {@link ProviderFactory} from a credential schema
 * and a connect function.
 *
 * This mirrors {@link makeSqlProvider} but is generic over credentials
 * so that S3, GCS, and Azure can each supply their own schema.
 */
export const makeObjectProvider = <TCred>(
	id: string,
	credentials: z.ZodType<TCred>,
	connect: (creds: TCred) => Promise<ProviderInstance<ObjectStoreClient>>,
): ProviderFactory<TCred, ObjectStoreClient> =>
	Provider.withAuthentication(id, {
		credentials,
		connect,
	});
