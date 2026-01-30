import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { ObjectStorage } from "#object/base.js";
import type { ObjectStore } from "#object/base.js";

/** Credentials for connecting to Google Drive. */
export interface GoogleDriveCredentials {
	/** OAuth2 access token. */
	accessToken: string;
}

/** Google Drive-specific configuration. */
export interface GoogleDriveConfig {
	bucket: string;
	prefix?: string;
	recursive?: boolean;
}

/**
 * Layer providing an {@link ObjectStore} backed by Google Drive.
 *
 * @example
 * ```ts
 * const layer = GoogleDriveLayer(
 *   { accessToken: "..." },
 *   { bucket: "my-drive-folder" },
 * );
 * ```
 */
export const GoogleDriveLayer = (
	_creds: GoogleDriveCredentials,
	_params: GoogleDriveConfig,
): Layer.Layer<ObjectStorage, ConnectionError> =>
	Layer.scoped(
		ObjectStorage,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: create Google Drive client
				const service: ObjectStore = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "google-drive" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "google-drive" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
