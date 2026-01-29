import type { ObjectData } from "@nvisy/core";
import type { Connector } from "../../interfaces/connector.js";
import type { DataInput } from "../../interfaces/data-input.js";
import type { DataOutput } from "../../interfaces/data-output.js";
import type { Resumable } from "../../interfaces/resumable.js";
import type { ObjectContext } from "../../params/context.js";
import type { ObjectParams } from "../../params/object.js";

/** Credentials for connecting to OneDrive. */
export interface OneDriveCredentials {
	/** OAuth2 access token. */
	accessToken: string;
}

/** OneDrive-specific configuration. */
export interface OneDriveConfig extends ObjectParams {}

/**
 * Stub connector for Microsoft OneDrive.
 *
 * Implements both DataInput and DataOutput for object data.
 */
export class OneDriveConnector
	implements
		DataInput<ObjectData, ObjectContext>,
		DataOutput<ObjectData>,
		Connector<OneDriveCredentials, OneDriveConfig>
{
	async connect(
		_creds: OneDriveCredentials,
		_params: OneDriveConfig,
	): Promise<void> {
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
