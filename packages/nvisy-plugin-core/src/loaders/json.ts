/**
 * JSON / JSON Lines loader.
 *
 * Converts `.json` and `.jsonl` blobs into Documents.
 *
 * - **`.json`** — if the root value is an array, each element becomes
 *   a Document; otherwise the entire file becomes a single Document.
 * - **`.jsonl`** — each non-empty line is parsed as a separate JSON
 *   object and becomes its own Document.
 *
 * @module
 */

import type { Blob, Metadata } from "@nvisy/core";
import { Document, Loader } from "@nvisy/core";
import { z } from "zod";

/** Schema for JSON loader parameters. */
export const jsonParamsSchema = z
	.object({
		/** Character encoding of the blob data. Defaults to `"utf-8"`. */
		encoding: z
			.enum(["utf-8", "ascii", "latin1", "utf16le"])
			.optional()
			.default("utf-8"),
	})
	.strict();

export type JsonParams = z.infer<typeof jsonParamsSchema>;

/**
 * Loader that converts JSON / JSONL blobs into Documents.
 *
 * Each JSON value is stringified as the Document's content, with
 * scalar fields promoted to metadata when the value is an object.
 */
export const jsonLoader = Loader.define<JsonParams>("json", {
	extensions: [".json", ".jsonl", ".ndjson"],
	contentTypes: ["application/json", "application/x-ndjson"],
	params: jsonParamsSchema,
	async *load(blob, params) {
		const text = blob.data.toString(params.encoding);
		const isJsonLines =
			blob.path.endsWith(".jsonl") || blob.path.endsWith(".ndjson");

		if (isJsonLines) {
			yield* loadJsonLines(text, blob);
		} else {
			yield* loadJson(text, blob);
		}
	},
});

/** Parse a single JSON file. Arrays are exploded into one Document per element. */
function* loadJson(text: string, blob: Blob): Generator<Document> {
	const parsed: unknown = JSON.parse(text);

	if (Array.isArray(parsed)) {
		for (let i = 0; i < parsed.length; i++) {
			yield toDocument(parsed[i], blob, { arrayIndex: i });
		}
	} else {
		yield toDocument(parsed, blob, {});
	}
}

/** Parse newline-delimited JSON (one object per line). */
function* loadJsonLines(text: string, blob: Blob): Generator<Document> {
	const lines = text.split(/\r?\n/);
	let index = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0) continue;

		const parsed: unknown = JSON.parse(trimmed);
		yield toDocument(parsed, blob, { lineIndex: index });
		index++;
	}
}

/** Convert a parsed JSON value into a Document with metadata. */
function toDocument(value: unknown, blob: Blob, baseMeta: Metadata): Document {
	const content =
		typeof value === "string" ? value : JSON.stringify(value, null, 2);
	const metadata: Metadata = { ...baseMeta };

	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		for (const [k, v] of Object.entries(value)) {
			if (
				typeof v === "string" ||
				typeof v === "number" ||
				typeof v === "boolean"
			) {
				metadata[k] = v;
			}
		}
	}

	return new Document(content, { sourceType: "json" })
		.deriveFrom(blob)
		.withMetadata(metadata);
}
