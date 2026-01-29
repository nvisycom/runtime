import type { ObjectData } from "@nvisy/core";
import type { Connector } from "../interfaces/connector.js";
import type { DataInput } from "../interfaces/data-input.js";
import type { DataOutput } from "../interfaces/data-output.js";
import type { Resumable } from "../interfaces/resumable.js";
import type { ObjectContext } from "../params/context.js";
import type { ObjectParams } from "../params/object.js";

/** Credentials for connecting to Amazon S3 (or S3-compatible stores). */
export interface S3Credentials {
	/** AWS access key ID. */
	accessKeyId: string;
	/** AWS secret access key. */
	secretAccessKey: string;
	/** AWS region (e.g. "us-east-1"). */
	region: string;
	/** Optional custom endpoint URL for S3-compatible stores. */
	endpointUrl?: string;
}

/** S3-specific configuration. */
export interface S3Config extends ObjectParams {}

/**
 * Stub connector for Amazon S3 / S3-compatible object stores.
 *
 * Implements both DataInput and DataOutput for object data.
 */
export class S3Connector
	implements
		DataInput<ObjectData, ObjectContext>,
		DataOutput<ObjectData>,
		Connector<S3Credentials, S3Config>
{
	async connect(_creds: S3Credentials, _params: S3Config): Promise<void> {
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
