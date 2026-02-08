/**
 * Page-based chunking strategy.
 *
 * Splits documents at page boundaries. When structured elements with
 * page numbers are available, elements are grouped by page; otherwise
 * the raw text is split on common page-break markers (`\f`, `---`,
 * `***`).
 *
 * @module
 */

import { Chunk, Document } from "@nvisy/core";

/** Page-strategy parameters. */
export interface PageStrategyParams {
	/** Optional maximum chunk size in characters. Splits pages that exceed this limit. */
	readonly maxCharacters?: number | undefined;
}

/** Split a document on page boundaries (elements or text markers). */
export function* chunkByPage(
	doc: Document,
	params: PageStrategyParams,
): Generator<Chunk> {
	let texts: string[];

	// Element-based path: group elements by page number
	if (doc.elements != null && doc.elements.length > 0) {
		texts = [...doc.getElementsByPage().entries()]
			.sort(([a], [b]) => a - b)
			.map(([, els]) => Document.fromElements(els).content);
	} else {
		// Fallback: split on common page break markers
		const pages = doc.content.split(/\f|\n---\n|\n\*\*\*\n/);
		const filtered: string[] = [];
		for (const page of pages) {
			const trimmed = page.trim();
			if (trimmed.length > 0) {
				filtered.push(trimmed);
			}
		}
		texts = filtered.length > 0 ? filtered : [doc.content];
	}

	if (params.maxCharacters != null) {
		texts = splitLongTexts(texts, params.maxCharacters);
	}

	for (let i = 0; i < texts.length; i++) {
		yield new Chunk(texts[i]!, {
			chunkIndex: i,
			chunkTotal: texts.length,
		}).deriveFrom(doc);
	}
}

/** Split texts that exceed maxCharacters into smaller pieces. */
function splitLongTexts(texts: string[], max: number): string[] {
	const result: string[] = [];
	for (const text of texts) {
		if (text.length <= max) {
			result.push(text);
		} else {
			for (let i = 0; i < text.length; i += max) {
				result.push(text.slice(i, i + max));
			}
		}
	}
	return result;
}
