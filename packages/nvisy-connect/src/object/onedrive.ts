import { Effect, Layer, Stream } from "effect";
import { ConnectionError, StorageError } from "@nvisy/core";
import { ObjectStorage } from "#object/base.js";
import type { ObjectStore } from "#object/base.js";

/** Credentials for connecting to OneDrive. */
export interface OneDriveCredentials {
	/** OAuth2 access token. */
	accessToken: string;
}

/** OneDrive-specific configuration. */
export interface OneDriveConfig {
	bucket: string;
	prefix?: string;
	recursive?: boolean;
}

/**
 * Layer providing an {@link ObjectStore} backed by Microsoft OneDrive.
 *
 * @example
 * ```ts
 * const layer = OneDriveLayer(
 *   { accessToken: "..." },
 *   { bucket: "my-folder" },
 * );
 * ```
 */
export const OneDriveLayer = (
	_creds: OneDriveCredentials,
	_params: OneDriveConfig,
): Layer.Layer<ObjectStorage, ConnectionError> =>
	Layer.scoped(
		ObjectStorage,
		Effect.acquireRelease(
			Effect.gen(function* () {
				// TODO: create OneDrive client
				const service: ObjectStore = {
					read: (_ctx) =>
						Stream.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "onedrive" },
							}),
						),
					write: (_items) =>
						Effect.fail(
							new StorageError({
								message: "Not yet implemented",
								context: { source: "onedrive" },
							}),
						),
				};
				return service;
			}),
			(_service) => Effect.void,
		),
	);
