import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { ObjectStorage } from "#object/base.js";
import type { ObjectStore } from "#object/base.js";

/** Credentials for connecting to Amazon S3 (or S3-compatible stores). */
export interface S3Credentials {
	/** AWS access key ID. */
	accessKeyId: string;
	/** AWS secret access key. */
	secretAccessKey: string;
	/** AWS region (e.g. `"us-east-1"`). */
	region: string;
	/** Optional custom endpoint URL for S3-compatible stores. */
	endpointUrl?: string;
}

/** S3-specific configuration. */
export interface S3Config {
	bucket: string;
	prefix?: string;
	recursive?: boolean;
}

/**
 * Layer providing an {@link ObjectStore} backed by Amazon S3.
 *
 * @example
 * ```ts
 * const layer = S3Layer(
 *   { accessKeyId: "...", secretAccessKey: "...", region: "us-east-1" },
 *   { bucket: "my-bucket" },
 * );
 * ```
 */
export const S3Layer = (
	_creds: S3Credentials,
	_params: S3Config,
): Layer.Layer<ObjectStorage, ConnectionError> =>
	Layer.scoped(
		ObjectStorage,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: create S3 client
				const service: ObjectStore = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "s3" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "s3" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
