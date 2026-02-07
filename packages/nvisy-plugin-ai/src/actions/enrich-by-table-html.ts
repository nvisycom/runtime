/**
 * Table-to-HTML enrichment strategy.
 *
 * Converts table content into HTML markup using an AI model.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import type { AICompletionClient } from "../providers/client.js";
import { parseJsonResponse } from "../providers/client.js";

/** Table-to-HTML enrichment parameters (no additional options). */
export type TableHtmlEnrichParams = Record<string, never>;

/** Convert table content to HTML using AI. */
export async function enrichByTableHtml(
	text: string,
	_params: TableHtmlEnrichParams,
	client: AICompletionClient,
): Promise<Metadata> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content:
					'Convert the following table content into clean HTML. Return ONLY a JSON object with an "html" field containing the HTML table markup.',
			},
			{ role: "user", content: text },
		],
	});
	return parseJsonResponse(result.content, "tableHtml");
}
