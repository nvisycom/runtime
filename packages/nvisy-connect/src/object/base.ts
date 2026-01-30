import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect";
import type { Blob } from "@nvisy/core";
import type { ConnectionError, StorageError } from "@nvisy/core";
import type { DataInput, DataOutput } from "#core/stream.js";

// ── Object store params ─────────────────────────────────────────────

/** Configuration parameters for an object store connector. */
export interface ObjectParams {
	/** Bucket or container name. */
	bucket: string;
	/** Key prefix to scope operations (optional). */
	prefix?: string;
	/** Whether to list objects recursively. */
	recursive?: boolean;
}

/** Resumption context for object store reads. */
export interface ObjectContext {
	/** Continuation cursor for listing. */
	cursor?: string;
}

// ── Error type ──────────────────────────────────────────────────────

/** Errors that may occur during object storage operations. */
export type ObjectError = ConnectionError | StorageError;

// ── Service interface ───────────────────────────────────────────────

/**
 * Service interface for object storage connectors (S3, GCS, Dropbox, etc.).
 *
 * Object stores support both reading and writing blobs. The connect/disconnect
 * lifecycle is managed by the Layer.
 */
export interface ObjectStore
	extends
		DataInput<Blob, ObjectContext, ObjectError>,
		DataOutput<Blob, ObjectError> {}

// ── Context.Tag ─────────────────────────────────────────────────────

/** Effect service tag for object storage access. */
export class ObjectStorage extends Context.Tag("@nvisy/connect/ObjectStorage")<
	ObjectStorage,
	ObjectStore
>() {}

// ── Layer factory ───────────────────────────────────────────────────

/**
 * Create a Layer that provides an {@link ObjectStore} service.
 *
 * The `connect` function should use `Effect.acquireRelease` to pair
 * connection establishment with teardown.
 */
export const makeObjectLayer = <TCred>(config: {
	readonly creds: TCred;
	readonly params: ObjectParams;
	readonly connect: (
		creds: TCred,
		params: ObjectParams,
	) => Effect.Effect<ObjectStore, ConnectionError, Scope.Scope>;
}): Layer.Layer<ObjectStorage, ConnectionError> =>
	Layer.scoped(ObjectStorage, config.connect(config.creds, config.params));

// ── Utilities ───────────────────────────────────────────────────────

/**
 * Detect a MIME content type from a file path extension.
 *
 * @param path - File path or object key.
 * @returns Best-guess MIME type, defaults to `"application/octet-stream"`.
 */
export function detectContentType(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase();
	const types: Record<string, string> = {
		pdf: "application/pdf",
		json: "application/json",
		csv: "text/csv",
		txt: "text/plain",
		html: "text/html",
		xml: "application/xml",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		svg: "image/svg+xml",
		mp3: "audio/mpeg",
		mp4: "video/mp4",
		zip: "application/zip",
	};
	return (ext && types[ext]) || "application/octet-stream";
}

/**
 * Normalize an object storage path by collapsing duplicate slashes
 * and stripping leading/trailing slashes.
 *
 * @param path - Raw path string.
 * @returns Cleaned path.
 */
export function normalizePath(path: string): string {
	return path.replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
}
