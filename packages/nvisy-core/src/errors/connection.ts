import { NvisyError } from "./base.js";

export class ConnectionError extends NvisyError {
	readonly code = "CONNECTION_ERROR";
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

export class ConnectionNotFoundError extends NvisyError {
	readonly code = "CONNECTION_NOT_FOUND";
	readonly connectionId: string;
	constructor(connectionId: string) {
		super(`Connection not found: ${connectionId}`);
		this.connectionId = connectionId;
	}
}
