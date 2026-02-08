/**
 * CSV loader.
 *
 * Converts `.csv` and `.tsv` blobs into Documents. Each row becomes
 * a separate Document whose content is built from the cell values.
 * When a header row is present, cell values are formatted as
 * `"column: value"` lines; otherwise raw comma-separated values are
 * used as content.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import { Document, Loader } from "@nvisy/core";
import { z } from "zod";

/** Schema for CSV loader parameters. */
export const csvParamsSchema = z
	.object({
		/** Column delimiter. Defaults to `","`. */
		delimiter: z.string().optional().default(","),
		/** Whether the first row contains column headers. Defaults to `true`. */
		hasHeader: z.boolean().optional().default(true),
		/** Character encoding of the blob data. Defaults to `"utf-8"`. */
		encoding: z
			.enum(["utf-8", "ascii", "latin1", "utf16le"])
			.optional()
			.default("utf-8"),
	})
	.strict();

export type CsvParams = z.infer<typeof csvParamsSchema>;

/**
 * Loader that converts CSV/TSV blobs into one Document per row.
 *
 * Header columns are stored as metadata on each Document.
 */
export const csvLoader = Loader.define<CsvParams>("csv", {
	extensions: [".csv", ".tsv"],
	contentTypes: ["text/csv", "text/tab-separated-values"],
	params: csvParamsSchema,
	async *load(blob, params) {
		const text = blob.data.toString(params.encoding);
		const lines = parseLines(text);
		if (lines.length === 0) return;

		let headers: string[] | null = null;
		let startIndex = 0;

		if (params.hasHeader && lines.length > 0) {
			headers = splitRow(lines[0]!, params.delimiter);
			startIndex = 1;
		}

		for (let i = startIndex; i < lines.length; i++) {
			const cells = splitRow(lines[i]!, params.delimiter);
			const content = headers
				? headers.map((h, j) => `${h}: ${cells[j] ?? ""}`).join("\n")
				: cells.join(params.delimiter);

			const metadata: Metadata = {
				rowIndex: i - startIndex,
				...(headers
					? Object.fromEntries(headers.map((h, j) => [h, cells[j] ?? ""]))
					: {}),
			};

			const doc = new Document(content, { sourceType: "csv" })
				.deriveFrom(blob)
				.withMetadata(metadata);
			yield doc;
		}
	},
});

/** Split text into non-empty lines, handling \r\n and \n. */
function parseLines(text: string): string[] {
	return text.split(/\r?\n/).filter((line) => line.length > 0);
}

/** Split a single CSV row on the delimiter, respecting double-quoted fields. */
function splitRow(line: string, delimiter: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i]!;

		if (inQuotes) {
			if (char === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
				} else {
					inQuotes = false;
					i++;
				}
			} else {
				current += char;
				i++;
			}
		} else if (char === '"') {
			inQuotes = true;
			i++;
		} else if (line.startsWith(delimiter, i)) {
			fields.push(current);
			current = "";
			i += delimiter.length;
		} else {
			current += char;
			i++;
		}
	}

	fields.push(current);
	return fields;
}
