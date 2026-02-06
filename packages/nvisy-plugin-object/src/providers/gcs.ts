import { Storage, type StorageOptions } from "@google-cloud/storage";
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
 * Credentials for connecting to Google Cloud Storage.
 */
export const GcsCredentials = z.object({
	/** GCP project ID. */
	projectId: z.string(),
	/** GCS bucket name. */
	bucket: z.string(),
	/** Path to a service-account key file (optional if running on GCE). */
	keyFilename: z.string().optional(),
});
export type GcsCredentials = z.infer<typeof GcsCredentials>;

class GcsObjectStoreClient extends ObjectStoreClient {
	readonly #storage: Storage;
	readonly #bucket: string;

	constructor(storage: Storage, bucket: string) {
		super();
		this.#storage = storage;
		this.#bucket = bucket;
	}

	async list(prefix: string, cursor?: string): Promise<ListResult> {
		const options: { prefix: string; startOffset?: string } = { prefix };
		if (cursor) {
			options.startOffset = cursor;
		}

		const [files] = await this.#storage.bucket(this.#bucket).getFiles(options);
		// When resuming, GCS startOffset is inclusive — skip the cursor key itself
		const keys = files
			.map((f) => f.name)
			.filter((name) => name !== cursor);
		return { keys };
	}

	async get(key: string): Promise<{ data: Buffer; contentType?: string }> {
		const file = this.#storage.bucket(this.#bucket).file(key);
		const [contents] = await file.download();
		const [metadata] = await file.getMetadata();
		const contentType = metadata.contentType as string | undefined;
		if (contentType) {
			return { data: contents, contentType };
		}
		return { data: contents };
	}

	async put(key: string, data: Buffer, contentType?: string): Promise<void> {
		const file = this.#storage.bucket(this.#bucket).file(key);
		if (contentType) {
			await file.save(data, { contentType });
		} else {
			await file.save(data);
		}
	}
}

/** Google Cloud Storage provider. */
export const gcs = makeObjectProvider("gcs", GcsCredentials, async (creds) => {
	logger.debug("Connecting to GCS bucket {bucket} in project {projectId}", {
		bucket: creds.bucket,
		projectId: creds.projectId,
	});

	const opts: StorageOptions = { projectId: creds.projectId };
	if (creds.keyFilename) {
		opts.keyFilename = creds.keyFilename;
	}
	const storage = new Storage(opts);

	return new ObjectStoreProvider(
		new GcsObjectStoreClient(storage, creds.bucket),
		"gcs",
	);
});
