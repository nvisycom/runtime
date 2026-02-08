/**
 * Section-based chunking strategy.
 *
 * Splits documents at markdown heading boundaries. When structured
 * elements are available, headings are matched by {@link Element.level};
 * otherwise the raw text is split on `#`-prefixed lines.
 *
 * @module
 */

import { Chunk, Document, type Element } from "@nvisy/core";

/** Section-strategy parameters. */
export interface SectionStrategyParams {
	/** Heading level to split on (1-6). */
	readonly level: number;
	/** Optional maximum chunk size in characters. Splits sections that exceed this limit. */
	readonly maxCharacters?: number | undefined;
	/** Combine consecutive sections whose text is shorter than this threshold. */
	readonly combineUnder?: number | undefined;
}

/** Split a document into sections at markdown headings of the given level. */
export function* chunkBySection(
	doc: Document,
	params: SectionStrategyParams,
): Generator<Chunk> {
	let texts: string[];

	// Element-based path: split structured elements by heading level
	if (doc.elements != null && doc.elements.length > 0) {
		texts = splitByHeadingLevel(doc.elements, params.level).map(
			(els) => Document.fromElements(els).content,
		);
	} else {
		// Fallback: string-based splitting
		const prefix = "#".repeat(params.level);
		const pattern = new RegExp(`^${prefix}\\s`, "m");
		const parts = doc.content.split(pattern);

		const sections: string[] = [];
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]!.trim();
			if (part.length === 0) continue;
			// Re-add the heading prefix for sections after the first
			sections.push(i > 0 ? `${prefix} ${part}` : part);
		}
		texts = sections.length > 0 ? sections : [doc.content];
	}

	if (params.combineUnder != null) {
		texts = combineShortTexts(texts, params.combineUnder);
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

/** Combine consecutive texts that are shorter than the threshold. */
function combineShortTexts(texts: string[], threshold: number): string[] {
	const result: string[] = [];
	let buffer = "";

	for (const text of texts) {
		if (buffer.length === 0) {
			buffer = text;
		} else if (buffer.length + text.length < threshold) {
			buffer += `\n\n${text}`;
		} else {
			result.push(buffer);
			buffer = text;
		}
	}
	if (buffer.length > 0) {
		result.push(buffer);
	}
	return result;
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

/** Split elements into sections at headings of the given level. */
function splitByHeadingLevel(
	elements: readonly Element[],
	level: number,
): Element[][] {
	const sections: Element[][] = [];
	let current: Element[] = [];

	for (const el of elements) {
		if (el.type === "title" && el.level != null && el.level <= level) {
			if (current.length > 0) {
				sections.push(current);
			}
			current = [el];
		} else {
			current.push(el);
		}
	}
	if (current.length > 0) {
		sections.push(current);
	}
	return sections;
}
