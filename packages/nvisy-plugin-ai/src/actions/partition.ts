import type { Data, Metadata } from "@nvisy/core";
import { Action, Blob, Document } from "@nvisy/core";
import { z } from "zod";

const AutoStrategy = z.object({
	strategy: z.literal("auto"),
});

const RuleStrategy = z.object({
	strategy: z.literal("rule"),
	/** Regex pattern to split content on. */
	pattern: z.string(),
	/** Whether to include the delimiter in chunks. Defaults to false. */
	includeDelimiter: z.boolean().default(false),
});

const PartitionParams = z.discriminatedUnion("strategy", [
	AutoStrategy,
	RuleStrategy,
]);

/**
 * Partition blobs or documents into structured documents.
 *
 * - `"auto"`: detect content type from {@link Blob} and extract text
 * - `"rule"`: split content using a regex pattern
 */
export const partition = Action.withoutClient("partition", {
	types: [Document, Document] as [typeof Data, typeof Document],
	params: PartitionParams,
	transform: transformPartition,
});

async function* transformPartition(
	stream: AsyncIterable<Data>,
	params: z.infer<typeof PartitionParams>,
) {
	for await (const item of stream) {
		const text = extractText(item);
		const sourceId = item.id;
		const baseMeta = item.metadata;

		let parts: string[];

		const inputDoc = item instanceof Document ? item : undefined;

		switch (params.strategy) {
			case "auto":
				parts = [text];
				break;
			case "rule": {
				const regex = new RegExp(params.pattern, "g");
				if (params.includeDelimiter) {
					parts = text.split(regex).filter((p) => p.length > 0);
				} else {
					parts = text.split(regex).filter((p) => p.length > 0);
				}
				break;
			}
		}

		for (let i = 0; i < parts.length; i++) {
			const metadata: Metadata = {
				...(baseMeta ?? {}),
				sourceId,
				partIndex: i,
				partTotal: parts.length,
			};
			yield new Document(parts[i]!, {
				metadata,
				...(params.strategy === "auto" && inputDoc?.pages != null
					? { pages: inputDoc.pages }
					: {}),
			});
		}
	}
}

function extractText(item: Data): string {
	if (item instanceof Blob) {
		return item.data.toString("utf-8");
	}
	if (item instanceof Document) {
		return item.content;
	}
	return String(item);
}
