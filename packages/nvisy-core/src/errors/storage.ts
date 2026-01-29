import { NvisyError } from "./base.js";

export enum StorageErrorKind {
	Connection = "connection",
	Authentication = "authentication",
	NotFound = "not_found",
	PermissionDenied = "permission_denied",
	Timeout = "timeout",
	Unknown = "unknown",
}

export class StorageError extends NvisyError {
	readonly code = "STORAGE_ERROR";
	readonly kind: StorageErrorKind;

	constructor(message: string, kind: StorageErrorKind, cause?: Error) {
		super(message, cause);
		this.kind = kind;
	}
}
