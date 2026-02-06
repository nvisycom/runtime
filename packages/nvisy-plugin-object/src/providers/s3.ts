import {
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getLogger } from "@logtape/logtape";
import { z } from "zod";
import {
	type ListResult,
	makeObjectProvider,
	ObjectStoreClient,
	ObjectStoreProvider,
} from "./client.js";

const logger = getLogger(["nvisy", "object"]);

/**
 * Credentials for connecting to Amazon S3.
 */
export const S3Credentials = z.object({
	/** AWS region (e.g. `"us-east-1"`). */
	region: z.string(),
	/** S3 bucket name. */
	bucket: z.string(),
	/** AWS access key ID. */
	accessKeyId: z.string(),
	/** AWS secret access key. */
	secretAccessKey: z.string(),
	/** Optional custom endpoint for S3-compatible stores (e.g. MinIO). */
	endpoint: z.string().optional(),
});
export type S3Credentials = z.infer<typeof S3Credentials>;

class S3ObjectStoreClient extends ObjectStoreClient {
	readonly #client: S3Client;
	readonly #bucket: string;

	constructor(client: S3Client, bucket: string) {
		super();
		this.#client = client;
		this.#bucket = bucket;
	}

	async list(prefix: string, cursor?: string): Promise<ListResult> {
		const response = await this.#client.send(
			new ListObjectsV2Command({
				Bucket: this.#bucket,
				Prefix: prefix,
				StartAfter: cursor,
			}),
		);
		const keys = (response.Contents ?? [])
			.map((o) => o.Key)
			.filter((k): k is string => k != null);
		const lastKey = response.IsTruncated
			? response.Contents?.at(-1)?.Key
			: undefined;
		if (lastKey) {
			return { keys, nextCursor: lastKey };
		}
		return { keys };
	}

	async get(key: string): Promise<{ data: Buffer; contentType?: string }> {
		const response = await this.#client.send(
			new GetObjectCommand({ Bucket: this.#bucket, Key: key }),
		);
		const bytes = await response.Body!.transformToByteArray();
		const contentType = response.ContentType;
		if (contentType) {
			return { data: Buffer.from(bytes), contentType };
		}
		return { data: Buffer.from(bytes) };
	}

	async put(key: string, data: Buffer, contentType?: string): Promise<void> {
		await this.#client.send(
			new PutObjectCommand({
				Bucket: this.#bucket,
				Key: key,
				Body: data,
				ContentType: contentType,
			}),
		);
	}
}

/** Amazon S3 provider. */
export const s3 = makeObjectProvider("s3", S3Credentials, async (creds) => {
	logger.debug("Connecting to S3 bucket {bucket} in {region}", {
		bucket: creds.bucket,
		region: creds.region,
	});

	const config: S3ClientConfig = {
		region: creds.region,
		credentials: {
			accessKeyId: creds.accessKeyId,
			secretAccessKey: creds.secretAccessKey,
		},
	};
	if (creds.endpoint) {
		config.endpoint = creds.endpoint;
	}

	const client = new S3Client(config);

	return new ObjectStoreProvider(
		new S3ObjectStoreClient(client, creds.bucket),
		"s3",
		async () => client.destroy(),
	);
});
