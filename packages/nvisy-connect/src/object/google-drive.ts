import type { Blob } from "@nvisy/core";
import type { Resumable } from "#core/stream.js";
import { ObjectStore } from "#object/base.js";
import type { ObjectContext } from "#object/base.js";

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
 * Connector for Google Drive file storage.
 *
 * @example
 * ```ts
 * const drive = new GoogleDriveConnector(
 *   { accessToken: "..." },
 *   { bucket: "my-drive-folder" },
 * );
 * await drive.connect();
 * ```
 */
export class GoogleDriveConnector extends ObjectStore<
	GoogleDriveCredentials,
	GoogleDriveConfig
> {
	async connect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async *read(
		_ctx: ObjectContext,
	): AsyncIterable<Resumable<Blob, ObjectContext>> {
		throw new Error("Not yet implemented");
	}

	async write(_items: Blob[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
