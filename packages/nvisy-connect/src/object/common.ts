/**
 * Detect a MIME content type from a file path extension.
 *
 * @param path - File path or object key.
 * @returns Best-guess MIME type, defaults to "application/octet-stream".
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
