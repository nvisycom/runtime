/**
 * Rule-based partition action that splits documents using auto
 * pass-through or regex-based splitting.
 *
 * @module
 */

import type { Metadata } from "@nvisy/core";
import { Action, Document } from "@nvisy/core";
import { z } from "zod";
import { partitionByAuto } from "./partition-by-auto.js";
import { partitionByRule } from "./partition-by-rule.js";

export type { AutoStrategyParams } from "./partition-by-auto.js";
export type { RuleStrategyParams } from "./partition-by-rule.js";

const BaseAuto = z.object({});

const BaseRule = z.object({
	pattern: z.string(),
	includeDelimiter: z.boolean().default(false),
	inferTableStructure: z.boolean().default(false),
});

const AutoStrategy = BaseAuto.extend({
	strategy: z.literal("auto"),
});

const RuleStrategy = BaseRule.extend({
	strategy: z.literal("rule"),
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
): AsyncGenerator<Document> {
	for await (const item of stream) {
		let parts: string[];
		switch (params.strategy) {
			case "auto": {
				const { strategy: _, ...rest } = params;
				parts = partitionByAuto(item, rest);
				break;
			}
			case "rule": {
				const { strategy: _, ...rest } = params;
				parts = partitionByRule(item, rest);
				break;
			}
		}

		const sourceId = item.id;
		const baseMeta = item.metadata;

		for (let i = 0; i < parts.length; i++) {
			const metadata: Metadata = {
				...(baseMeta ?? {}),
				partIndex: i,
				partTotal: parts.length,
			};
			yield new Document(parts[i]!, {
				...(params.strategy === "auto" && item.elements != null
					? { elements: item.elements }
					: {}),
			})
				.withParent(sourceId)
				.withMetadata(metadata);
		}
	}
}
