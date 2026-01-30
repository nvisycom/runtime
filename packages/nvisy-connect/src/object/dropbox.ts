import type { ObjectData } from "@nvisy/core";
import type { Resumable } from "#core/stream.js";
import { ObjectStore } from "#object/base.js";
import type { ObjectContext } from "#object/base.js";

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
 * Connector for Dropbox file storage.
 *
 * @example
 * ```ts
 * const dropbox = new DropboxConnector(
 *   { accessToken: "..." },
 *   { bucket: "my-folder" },
 * );
 * await dropbox.connect();
 * ```
 */
export class DropboxConnector extends ObjectStore<
	DropboxCredentials,
	DropboxConfig
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
