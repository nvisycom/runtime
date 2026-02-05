import type { Metadata } from "@nvisy/core";
import { Action, Document } from "@nvisy/core";
import { z } from "zod";
import { AICompletionClient } from "../providers/client.js";

const MetadataType = z.object({
	type: z.literal("metadata"),
	/** Field names to extract from the document. */
	fields: z.array(z.string()),
});

const NerType = z.object({
	type: z.literal("ner"),
	/** Entity types to extract (e.g. ["PERSON", "ORG"]). If omitted, extract all. */
	entityTypes: z.array(z.string()).optional(),
});

const ImageDescriptionType = z.object({
	type: z.literal("image_description"),
});

const TableDescriptionType = z.object({
	type: z.literal("table_description"),
});

const TableToHtmlType = z.object({
	type: z.literal("table_to_html"),
});

const EnrichParams = z.discriminatedUnion("type", [
	MetadataType,
	NerType,
	ImageDescriptionType,
	TableDescriptionType,
	TableToHtmlType,
]);

/**
 * Enrich documents with AI-extracted metadata.
 *
 * - `"metadata"`: extract structured fields from content
 * - `"ner"`: named entity recognition
 * - `"image_description"`: describe image content
 * - `"table_description"`: describe table content
 * - `"table_to_html"`: convert table content to HTML
 */
export const enrich = Action.withClient("enrich", AICompletionClient, {
	types: [Document],
	params: EnrichParams,
	transform: transformEnrich,
});

async function* transformEnrich(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof EnrichParams>,
	client: AICompletionClient,
) {
	for await (const doc of stream) {
		let enrichedMeta: Metadata;

		switch (params.type) {
			case "metadata":
				enrichedMeta = await extractMetadata(
					doc.content,
					params.fields,
					client,
				);
				break;
			case "ner":
				enrichedMeta = await extractEntities(
					doc.content,
					params.entityTypes,
					client,
				);
				break;
			case "image_description":
				enrichedMeta = await describeContent(doc.content, "image", client);
				break;
			case "table_description":
				enrichedMeta = await describeContent(doc.content, "table", client);
				break;
			case "table_to_html":
				enrichedMeta = await convertTableToHtml(doc.content, client);
				break;
		}

		yield new Document(doc.content, {
			...(doc.sourceType != null ? { sourceType: doc.sourceType } : {}),
			...(doc.pages != null ? { pages: doc.pages } : {}),
		})
			.deriveFrom(doc)
			.withMetadata({ ...(doc.metadata ?? {}), ...enrichedMeta });
	}
}

async function extractMetadata(
	text: string,
	fields: string[],
	client: AICompletionClient,
): Promise<Metadata> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `Extract the following fields from the document: ${fields.join(", ")}. Return ONLY a JSON object with these fields as keys. If a field cannot be determined, set it to null.`,
			},
			{ role: "user", content: text },
		],
	});
	return parseJsonResponse(result.content, "extracted");
}

async function extractEntities(
	text: string,
	entityTypes: string[] | undefined,
	client: AICompletionClient,
): Promise<Metadata> {
	const typeClause = entityTypes
		? `Focus on these entity types: ${entityTypes.join(", ")}.`
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

async function describeContent(
	text: string,
	contentKind: "image" | "table",
	client: AICompletionClient,
): Promise<Metadata> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `Describe the following ${contentKind} content in detail. Return ONLY a JSON object with a "description" field containing your description.`,
			},
			{ role: "user", content: text },
		],
	});
	return parseJsonResponse(result.content, "description");
}

async function convertTableToHtml(
	text: string,
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

function parseJsonResponse(content: string, fallbackKey: string): Metadata {
	try {
		const parsed = JSON.parse(content) as Record<string, unknown>;
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			!Array.isArray(parsed)
		) {
			return parsed as Metadata;
		}
	} catch {
		// If JSON parsing fails, store the raw response
	}
	return { [fallbackKey]: content };
}
