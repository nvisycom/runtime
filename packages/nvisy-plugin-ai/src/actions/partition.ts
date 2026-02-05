import type { Metadata } from "@nvisy/core";
import { Action, Document } from "@nvisy/core";
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
 * Partition documents into structured documents.
 *
 * - `"auto"`: pass through document content as-is
 * - `"rule"`: split content using a regex pattern
 */
export const partition = Action.withoutClient("partition", {
	types: [Document, Document],
	params: PartitionParams,
	transform: transformPartition,
});

async function* transformPartition(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof PartitionParams>,
) {
	for await (const item of stream) {
		const text = item.content;
		const sourceId = item.id;
		const baseMeta = item.metadata;

		let parts: string[];

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
				partIndex: i,
				partTotal: parts.length,
			};
			yield new Document(parts[i]!, {
				...(params.strategy === "auto" && item.pages != null
					? { pages: item.pages }
					: {}),
			})
				.withParent(sourceId)
				.withMetadata(metadata);
		}
	}
}
