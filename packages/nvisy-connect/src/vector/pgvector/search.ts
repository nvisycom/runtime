import type { SearchOptions, SearchResult } from "../common.js";

/**
 * Perform a semantic similarity search against a pgvector table.
 *
 * @param _options - Search parameters (query vector, topK, etc.)
 * @returns Search results with scores.
 */
export async function semanticSearch(
	_options: SearchOptions,
): Promise<SearchResult> {
	throw new Error("Not yet implemented");
}
