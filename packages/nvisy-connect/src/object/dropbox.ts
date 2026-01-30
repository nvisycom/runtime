import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { ObjectStorage } from "#object/base.js";
import type { ObjectStore } from "#object/base.js";

/** Credentials for connecting to Dropbox. */
export interface DropboxCredentials {
	/** OAuth2 access token. */
	accessToken: string;
}

/** Dropbox-specific configuration. */
export interface DropboxConfig {
	bucket: string;
	prefix?: string;
	recursive?: boolean;
}

/**
 * Layer providing an {@link ObjectStore} backed by Dropbox.
 *
 * @example
 * ```ts
 * const layer = DropboxLayer(
 *   { accessToken: "..." },
 *   { bucket: "my-folder" },
 * );
 * ```
 */
export const DropboxLayer = (
	_creds: DropboxCredentials,
	_params: DropboxConfig,
): Layer.Layer<ObjectStorage, ConnectionError> =>
	Layer.scoped(
		ObjectStorage,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: create Dropbox client
				const service: ObjectStore = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "dropbox" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "dropbox" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
