import { getLogger } from "@logtape/logtape";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { z } from "zod";
import {
	makeVectorProvider,
	type UpsertVector,
	VectorClient,
	VectorProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "vector"]);

/**
 * Credentials for connecting to Milvus / Zilliz.
 */
export const MilvusCredentials = z.object({
	/** Milvus server address (e.g. `"localhost:19530"`). */
	address: z.string(),
	/** Optional authentication token. */
	token: z.string().optional(),
	/** Name of the Milvus collection. */
	collectionName: z.string(),
});
export type MilvusCredentials = z.infer<typeof MilvusCredentials>;

class MilvusVectorClient extends VectorClient {
	readonly #client: MilvusClient;
	readonly #collectionName: string;

	constructor(client: MilvusClient, collectionName: string) {
		super();
		this.#client = client;
		this.#collectionName = collectionName;
	}

	async upsert(vectors: UpsertVector[]): Promise<void> {
		await this.#client.upsert({
			collection_name: this.#collectionName,
			data: vectors.map((v) => ({
				id: v.id,
				vector: [...v.vector],
				...v.metadata,
			})),
		});
	}
}

/** Milvus / Zilliz vector database provider. */
export const milvus = makeVectorProvider(
	"milvus",
	MilvusCredentials,
	async (creds) => {
		logger.debug(
			"Connecting to Milvus at {address} collection {collectionName}",
			{
				address: creds.address,
				collectionName: creds.collectionName,
			},
		);

		const config: ConstructorParameters<typeof MilvusClient>[0] = {
			address: creds.address,
		};
		if (creds.token) {
			config.token = creds.token;
		}

		const client = new MilvusClient(config);

		return new VectorProvider(
			new MilvusVectorClient(client, creds.collectionName),
			"milvus",
		);
	},
);
