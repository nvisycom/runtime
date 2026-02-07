/**
 * Metadata extraction enrichment strategy.
 *
 * Extracts structured fields from document content using an AI model.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import type { AICompletionClient } from "../providers/client.js";
import { parseJsonResponse } from "../providers/client.js";

/** Metadata enrichment parameters. */
export interface MetadataEnrichParams {
	/** Field names to extract from the document. */
	readonly fields: string[];
}

/** Extract structured metadata fields from text using AI. */
export async function enrichByMetadata(
	text: string,
	params: MetadataEnrichParams,
	client: AICompletionClient,
): Promise<Metadata> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `Extract the following fields from the document: ${params.fields.join(", ")}. Return ONLY a JSON object with these fields as keys. If a field cannot be determined, set it to null.`,
			},
			{ role: "user", content: text },
		],
	});
	return parseJsonResponse(result.content, "extracted");
}
