import { getLogger } from "@logtape/logtape";
import {
	Provider,
	type ProviderFactory,
	type ProviderInstance,
} from "@nvisy/core";
import type { z } from "zod";

const logger = getLogger(["nvisy", "vector"]);

/**
 * A single vector to upsert into the vector store.
 */
export interface UpsertVector {
	/** Unique identifier for this vector. */
	readonly id: string;
	/** The dense embedding vector. */
	readonly vector: Float32Array | number[];
	/** Optional metadata to store alongside the vector. */
	readonly metadata?: Record<string, unknown> | undefined;
}

/**
 * Abstract client that vector-store streams use for I/O.
 *
 * Each provider (Pinecone, Qdrant, Milvus, Weaviate, pgvector) supplies a
 * concrete subclass. The class reference is required by
 * {@link Stream.createTarget} for runtime client-type matching.
 */
export abstract class VectorClient {
	/** Upsert one or more vectors into the store. */
	abstract upsert(vectors: UpsertVector[]): Promise<void>;
}

/**
 * Connected vector-store provider instance.
 *
 * Holds a {@link VectorClient} and manages teardown on {@link disconnect}.
 */
export class VectorProvider implements ProviderInstance<VectorClient> {
	readonly client: VectorClient;
	readonly #id: string;
	readonly #disconnect: (() => Promise<void>) | undefined;

	constructor(
		client: VectorClient,
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
 * Create a vector-store {@link ProviderFactory} from a credential schema
 * and a connect function.
 */
export const makeVectorProvider = <TCred>(
	id: string,
	credentials: z.ZodType<TCred>,
	connect: (creds: TCred) => Promise<ProviderInstance<VectorClient>>,
): ProviderFactory<TCred, VectorClient> =>
	Provider.withAuthentication(id, {
		credentials,
		connect,
	});
