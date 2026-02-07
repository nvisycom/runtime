/**
 * Named entity recognition enrichment strategy.
 *
 * Extracts named entities from document content using an AI model.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import type { AICompletionClient } from "../providers/client.js";
import { parseJsonResponse } from "../providers/client.js";

/** NER enrichment parameters. */
export interface NerEnrichParams {
	/** Entity types to extract (e.g. ["PERSON", "ORG"]). If omitted, extract all. */
	readonly entityTypes?: string[] | undefined;
}

/** Extract named entities from text using AI. */
export async function enrichByNer(
	text: string,
	params: NerEnrichParams,
	client: AICompletionClient,
): Promise<Metadata> {
	const typeClause = params.entityTypes
		? `Focus on these entity types: ${params.entityTypes.join(", ")}.`
		: "Extract all entity types you can identify.";

	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `Perform named entity recognition on the following text. ${typeClause} Return ONLY a JSON object where keys are entity types and values are arrays of extracted entities.`,
			},
			{ role: "user", content: text },
		],
	});
	return { entities: parseJsonResponse(result.content, "entities") };
}
