/**
 * Content description enrichment strategy.
 *
 * Generates AI descriptions for image or table content.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import type { AICompletionClient } from "../providers/client.js";
import { parseJsonResponse } from "../providers/client.js";

/** Description enrichment parameters. */
export interface DescriptionEnrichParams {
	/** The kind of content to describe. */
	readonly contentKind: "image" | "table";
}

/** Describe content using AI. */
export async function enrichByDescription(
	text: string,
	params: DescriptionEnrichParams,
	client: AICompletionClient,
): Promise<Metadata> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `Describe the following ${params.contentKind} content in detail. Return ONLY a JSON object with a "description" field containing your description.`,
			},
			{ role: "user", content: text },
		],
	});
	return parseJsonResponse(result.content, "description");
}
