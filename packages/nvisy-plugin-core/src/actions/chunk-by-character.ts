/**
 * Character-based chunking strategy.
 *
 * Splits document content into fixed-size character windows
 * with configurable overlap.
 *
 * @module
 */

import { Chunk, type Document } from "@nvisy/core";

/** Character-strategy parameters. */
export interface CharacterStrategyParams {
	/** Maximum chunk size in characters. */
	readonly maxCharacters: number;
	/** Number of overlapping characters between chunks. */
	readonly overlap: number;
}

/** Split a document into fixed-size character chunks with optional overlap. */
export function* chunkByCharacter(
	doc: Document,
	params: CharacterStrategyParams,
): Generator<Chunk> {
	const text = doc.content;
	const step = params.maxCharacters - params.overlap;
	if (step <= 0) return;

	const total = Math.ceil(text.length / step);
	let index = 0;
	let start = 0;
	while (start < text.length) {
		yield new Chunk(text.slice(start, start + params.maxCharacters), {
			chunkIndex: index,
			chunkTotal: total,
		}).deriveFrom(doc);
		index++;
		start += step;
	}
}
