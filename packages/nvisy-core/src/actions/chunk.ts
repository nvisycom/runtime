/**
 * Rule-based chunk action that splits documents using character,
 * section, or page strategies.
 *
 * @module
 */

import { z } from "zod";
import { Chunk, Document } from "../datatypes/index.js";
import { Action } from "./action.js";
import { chunkByCharacter } from "./chunk-by-character.js";
import { chunkByPage } from "./chunk-by-page.js";
import { chunkBySection } from "./chunk-by-section.js";

export type { CharacterStrategyParams } from "./chunk-by-character.js";
export type { PageStrategyParams } from "./chunk-by-page.js";
export type { SectionStrategyParams } from "./chunk-by-section.js";

const BaseCharacter = z.object({
	maxCharacters: z.number(),
	overlap: z.number().default(0),
});

const BaseSection = z.object({
	level: z.number().min(1).max(6).default(2),
	maxCharacters: z.number().optional(),
	combineUnder: z.number().optional(),
});

const BasePage = z.object({
	maxCharacters: z.number().optional(),
});

const CharacterStrategy = BaseCharacter.extend({
	strategy: z.literal("character"),
});

const SectionStrategy = BaseSection.extend({
	strategy: z.literal("section"),
});

const PageStrategy = BasePage.extend({
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
export const chunkSimple = Action.withoutClient("chunk", {
	types: [Document, Chunk],
	params: ChunkParams,
	transform: transformChunk,
});

async function* transformChunk(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof ChunkParams>,
): AsyncGenerator<Chunk> {
	for await (const doc of stream) {
		switch (params.strategy) {
			case "character": {
				const { strategy: _, ...rest } = params;
				yield* chunkByCharacter(doc, rest);
				break;
			}
			case "section": {
				const { strategy: _, ...rest } = params;
				yield* chunkBySection(doc, rest);
				break;
			}
			case "page": {
				const { strategy: _, ...rest } = params;
				yield* chunkByPage(doc, rest);
				break;
			}
		}
	}
}
