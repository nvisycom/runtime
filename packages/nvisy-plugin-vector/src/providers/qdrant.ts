import { getLogger } from "@logtape/logtape";
import { QdrantClient } from "@qdrant/js-client-rest";
import { z } from "zod";
import {
	makeVectorProvider,
	type UpsertVector,
	VectorClient,
	VectorProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "vector"]);

/**
 * Credentials for connecting to Qdrant.
 */
export const QdrantCredentials = z.object({
	/** Qdrant server URL. */
	url: z.string(),
	/** Optional API key. */
	apiKey: z.string().optional(),
	/** Name of the Qdrant collection. */
	collectionName: z.string(),
});
export type QdrantCredentials = z.infer<typeof QdrantCredentials>;

class QdrantVectorClient extends VectorClient {
	readonly #client: QdrantClient;
	readonly #collectionName: string;

	constructor(client: QdrantClient, collectionName: string) {
		super();
		this.#client = client;
		this.#collectionName = collectionName;
	}

	async upsert(vectors: UpsertVector[]): Promise<void> {
		await this.#client.upsert(this.#collectionName, {
			points: vectors.map((v) => ({
				id: v.id,
				vector: [...v.vector],
				payload: v.metadata ?? {},
			})),
		});
	}
}

/** Qdrant vector database provider. */
export const qdrant = makeVectorProvider(
	"qdrant",
	QdrantCredentials,
	async (creds) => {
		logger.debug("Connecting to Qdrant at {url} collection {collectionName}", {
			url: creds.url,
			collectionName: creds.collectionName,
		});

		const config: ConstructorParameters<typeof QdrantClient>[0] = {
			url: creds.url,
		};
		if (creds.apiKey) {
			config.apiKey = creds.apiKey;
		}

		const client = new QdrantClient(config);

		return new VectorProvider(
			new QdrantVectorClient(client, creds.collectionName),
			"qdrant",
		);
	},
);
