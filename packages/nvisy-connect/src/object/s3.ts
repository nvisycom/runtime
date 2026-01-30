import type { Blob } from "@nvisy/core";
import type { Resumable } from "#core/stream.js";
import { ObjectStore } from "#object/base.js";
import type { ObjectContext } from "#object/base.js";

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
 * Connector for Amazon S3 and S3-compatible object stores.
 *
 * @example
 * ```ts
 * const s3 = new S3Connector(
 *   { accessKeyId: "...", secretAccessKey: "...", region: "us-east-1" },
 *   { bucket: "my-bucket" },
 * );
 * await s3.connect();
 * ```
 */
export class S3Connector extends ObjectStore<S3Credentials, S3Config> {
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
