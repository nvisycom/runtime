import type { ObjectData } from "@nvisy/core";
import type { DataInput, DataOutput, Resumable } from "#core/stream.js";
import { Provider } from "#core/provider.js";

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

// ── Base class ──────────────────────────────────────────────────────

/**
 * Abstract base class for object storage connectors (S3, GCS, Dropbox, etc.).
 *
 * Extends {@link Provider} to store credentials and configuration, and
 * implements both {@link DataInput} and {@link DataOutput} for
 * {@link ObjectData}.
 *
 * Subclasses implement {@link connect}, {@link disconnect}, {@link read},
 * and {@link write} for their specific storage backend.
 */
export abstract class ObjectStore<
	TCred,
	TConfig extends ObjectParams = ObjectParams,
> extends Provider<TCred, TConfig>
	implements DataInput<ObjectData, ObjectContext>, DataOutput<ObjectData>
{
	abstract read(
		ctx: ObjectContext,
	): AsyncIterable<Resumable<ObjectData, ObjectContext>>;
	abstract write(items: ObjectData[]): Promise<void>;
}

// ── Utilities ───────────────────────────────────────────────────────

/**
 * Detect a MIME content type from a file path extension.
 *
 * @param path - File path or object key.
 * @returns Best-guess MIME type, defaults to `"application/octet-stream"`.
 *
 * @example
 * ```ts
 * detectContentType("report.pdf"); // "application/pdf"
 * detectContentType("data.csv");   // "text/csv"
 * detectContentType("unknown");    // "application/octet-stream"
 * ```
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
 *
 * @example
 * ```ts
 * normalizePath("//uploads///file.pdf/"); // "uploads/file.pdf"
 * ```
 */
export function normalizePath(path: string): string {
	return path.replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
}
