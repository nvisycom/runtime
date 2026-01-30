import type { ObjectData } from "@nvisy/core";
import type { Resumable } from "#core/resumable.js";
import { ObjectStore } from "#object/base.js";
import type { ObjectContext } from "#object/base.js";

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
 * Connector for Microsoft OneDrive file storage.
 *
 * @example
 * ```ts
 * const onedrive = new OneDriveConnector(
 *   { accessToken: "..." },
 *   { bucket: "my-folder" },
 * );
 * await onedrive.connect();
 * ```
 */
export class OneDriveConnector extends ObjectStore<
	OneDriveCredentials,
	OneDriveConfig
> {
	async connect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async disconnect(): Promise<void> {
		throw new Error("Not yet implemented");
	}

	async *read(
		_ctx: ObjectContext,
	): AsyncIterable<Resumable<ObjectData, ObjectContext>> {
		throw new Error("Not yet implemented");
	}

	async write(_items: ObjectData[]): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
