import {
	type BlobHTTPHeaders,
	BlobServiceClient,
	type BlockBlobUploadOptions,
	type ContainerClient,
	StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { getLogger } from "@logtape/logtape";
import { z } from "zod";
import {
	type ListResult,
	ObjectStoreClient,
	ObjectStoreProvider,
	makeObjectProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "object"]);

/**
 * Credentials for connecting to Azure Blob Storage.
 */
export const AzureCredentials = z.object({
	/** Azure storage account name. */
	accountName: z.string(),
	/** Azure Blob container name. */
	containerName: z.string(),
	/** Storage account key (provide this or `connectionString`). */
	accountKey: z.string().optional(),
	/** Full connection string (provide this or `accountKey`). */
	connectionString: z.string().optional(),
});
export type AzureCredentials = z.infer<typeof AzureCredentials>;

class AzureObjectStoreClient extends ObjectStoreClient {
	readonly #container: ContainerClient;

	constructor(container: ContainerClient) {
		super();
		this.#container = container;
	}

	async list(prefix: string, cursor?: string): Promise<ListResult> {
		const keys: string[] = [];
		const iter = cursor
			? this.#container.listBlobsFlat({ prefix }).byPage({ continuationToken: cursor })
			: this.#container.listBlobsFlat({ prefix }).byPage();

		const page = await iter.next();
		if (!page.done) {
			for (const blob of page.value.segment.blobItems) {
				keys.push(blob.name);
			}
			const token = page.value.continuationToken;
			if (token) {
				return { keys, nextCursor: token };
			}
		}
		return { keys };
	}

	async get(key: string): Promise<{ data: Buffer; contentType?: string }> {
		const blobClient = this.#container.getBlobClient(key);
		const response = await blobClient.download();
		const body = response.readableStreamBody;
		if (!body) throw new Error(`Empty response body for blob "${key}"`);

		const chunks: Buffer[] = [];
		for await (const chunk of body) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const contentType = response.contentType;
		if (contentType) {
			return { data: Buffer.concat(chunks), contentType };
		}
		return { data: Buffer.concat(chunks) };
	}

	async put(key: string, data: Buffer, contentType?: string): Promise<void> {
		const blockClient = this.#container.getBlockBlobClient(key);
		const opts: BlockBlobUploadOptions = {};
		if (contentType) {
			const headers: BlobHTTPHeaders = { blobContentType: contentType };
			opts.blobHTTPHeaders = headers;
		}
		await blockClient.upload(data, data.byteLength, opts);
	}
}

function createContainerClient(
	creds: AzureCredentials,
): ContainerClient {
	if (creds.connectionString) {
		return BlobServiceClient.fromConnectionString(creds.connectionString)
			.getContainerClient(creds.containerName);
	}
	if (creds.accountKey) {
		const sharedKey = new StorageSharedKeyCredential(
			creds.accountName,
			creds.accountKey,
		);
		const service = new BlobServiceClient(
			`https://${creds.accountName}.blob.core.windows.net`,
			sharedKey,
		);
		return service.getContainerClient(creds.containerName);
	}
	throw new Error(
		"Azure credentials must include either accountKey or connectionString",
	);
}

/** Azure Blob Storage provider. */
export const azure = makeObjectProvider(
	"azure",
	AzureCredentials,
	async (creds) => {
		logger.debug(
			"Connecting to Azure container {containerName} in account {accountName}",
			{ containerName: creds.containerName, accountName: creds.accountName },
		);

		const container = createContainerClient(creds);

		return new ObjectStoreProvider(
			new AzureObjectStoreClient(container),
			"azure",
		);
	},
);
