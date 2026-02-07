import type { Element } from "@nvisy/core";
import { Action, Document } from "@nvisy/core";
import { z } from "zod";
import { Chunk } from "../datatypes/index.js";

const CharacterStrategy = z.object({
	strategy: z.literal("character"),
	/** Maximum chunk size in characters. */
	size: z.number(),
	/** Number of overlapping characters between chunks. */
	overlap: z.number().default(0),
});

const SectionStrategy = z.object({
	strategy: z.literal("section"),
	/** Heading level to split on (1-6). Defaults to 2. */
	level: z.number().min(1).max(6).default(2),
});

const PageStrategy = z.object({
	strategy: z.literal("page"),
});

const ChunkParams = z.discriminatedUnion("strategy", [
	CharacterStrategy,
	SectionStrategy,
	PageStrategy,
]);

/**
 * Split documents into smaller chunks using various strategies.
 *
 * - `"character"`: fixed-size character splitting with optional overlap
 * - `"section"`: split on markdown headings at a given level
 * - `"page"`: split on page boundary markers in content
 */
export const chunk = Action.withoutClient("chunk", {
	types: [Document, Chunk],
	params: ChunkParams,
	transform: transformChunk,
});

async function* transformChunk(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof ChunkParams>,
) {
	for await (const doc of stream) {
		switch (params.strategy) {
			case "page": {
				if (doc.elements != null && doc.elements.length > 0) {
					const groups = groupByPage(doc.elements);
					const pages = [...groups.entries()].sort(([a], [b]) => a - b);
					for (let i = 0; i < pages.length; i++) {
						const [, els] = pages[i]!;
						yield new Chunk(Document.fromElements(els).content, {
							chunkIndex: i,
							chunkTotal: pages.length,
						}).deriveFrom(doc);
					}
					continue;
				}
				break;
			}
			case "section": {
				if (doc.elements != null && doc.elements.length > 0) {
					const sections = splitByHeadingLevel(doc.elements, params.level);
					for (let i = 0; i < sections.length; i++) {
						const els = sections[i]!;
						yield new Chunk(Document.fromElements(els).content, {
							chunkIndex: i,
							chunkTotal: sections.length,
						}).deriveFrom(doc);
					}
					continue;
				}
				break;
			}
		}

		// Fallback: string-based chunking
		let texts: string[];
		switch (params.strategy) {
			case "character":
				texts = chunkByCharacter(doc.content, params.size, params.overlap);
				break;
			case "section":
				texts = chunkBySection(doc.content, params.level);
				break;
			case "page":
				texts = chunkByPage(doc.content);
				break;
		}

		for (let i = 0; i < texts.length; i++) {
			yield new Chunk(texts[i]!, {
				chunkIndex: i,
				chunkTotal: texts.length,
			}).deriveFrom(doc);
		}
	}
}

/** Group elements by their `pageNumber`, preserving document order. */
function groupByPage(elements: readonly Element[]): Map<number, Element[]> {
	const groups = new Map<number, Element[]>();
	for (const el of elements) {
		const page = el.pageNumber ?? 1;
		let group = groups.get(page);
		if (group == null) {
			group = [];
			groups.set(page, group);
		}
		group.push(el);
	}
	return groups;
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

function chunkByCharacter(
	text: string,
	size: number,
	overlap: number,
): string[] {
	const chunks: string[] = [];
	let start = 0;
	while (start < text.length) {
		chunks.push(text.slice(start, start + size));
		start += size - overlap;
		if (size - overlap <= 0) break;
	}
	return chunks;
}

function chunkBySection(text: string, level: number): string[] {
	const prefix = "#".repeat(level);
	const pattern = new RegExp(`^${prefix}\\s`, "m");
	const parts = text.split(pattern);

	const chunks: string[] = [];
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i]!.trim();
		if (part.length === 0) continue;
		// Re-add the heading prefix for sections after the first
		chunks.push(i > 0 ? `${prefix} ${part}` : part);
	}
	return chunks.length > 0 ? chunks : [text];
}

function chunkByPage(text: string): string[] {
	// Split on common page break markers
	const pages = text.split(/\f|\n---\n|\n\*\*\*\n/);
	const chunks: string[] = [];
	for (const page of pages) {
		const trimmed = page.trim();
		if (trimmed.length > 0) {
			chunks.push(trimmed);
		}
	}
	return chunks.length > 0 ? chunks : [text];
}
