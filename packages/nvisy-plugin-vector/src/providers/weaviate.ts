import { getLogger } from "@logtape/logtape";
import weaviate, { type WeaviateClient } from "weaviate-client";
import { z } from "zod";
import {
	makeVectorProvider,
	type UpsertVector,
	VectorClient,
	VectorProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "vector"]);

/**
 * Credentials for connecting to Weaviate.
 */
export const WeaviateCredentials = z.object({
	/** Weaviate host (e.g. `"localhost:8080"`). */
	host: z.string(),
	/** Weaviate gRPC port (defaults to 50051). */
	grpcPort: z.number().default(50051),
	/** Optional API key. */
	apiKey: z.string().optional(),
	/** Name of the Weaviate collection (class). */
	collectionName: z.string(),
});
export type WeaviateCredentials = z.infer<typeof WeaviateCredentials>;

class WeaviateVectorClient extends VectorClient {
	readonly #client: WeaviateClient;
	readonly #collectionName: string;

	constructor(client: WeaviateClient, collectionName: string) {
		super();
		this.#client = client;
		this.#collectionName = collectionName;
	}

	async upsert(vectors: UpsertVector[]): Promise<void> {
		const collection = this.#client.collections.get(this.#collectionName);
		await collection.data.insertMany(
			vectors.map((v) => ({
				properties: (v.metadata ?? {}) as Record<string, never>,
				vectors: [...v.vector],
			})),
		);
	}
}

/** Weaviate vector database provider. */
export const weaviateProvider = makeVectorProvider(
	"weaviate",
	WeaviateCredentials,
	async (creds) => {
		logger.debug(
			"Connecting to Weaviate at {host} collection {collectionName}",
			{
				host: creds.host,
				collectionName: creds.collectionName,
			},
		);

		const connectOpts: Parameters<typeof weaviate.connectToLocal>[0] = {
			host: creds.host,
			grpcPort: creds.grpcPort,
		};
		if (creds.apiKey) {
			connectOpts.authCredentials = new weaviate.ApiKey(creds.apiKey);
		}
		const client = await weaviate.connectToLocal(connectOpts);

		return new VectorProvider(
			new WeaviateVectorClient(client, creds.collectionName),
			"weaviate",
			async () => client.close(),
		);
	},
);
