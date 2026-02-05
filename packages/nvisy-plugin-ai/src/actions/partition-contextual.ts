import { Action, Document, RuntimeError } from "@nvisy/core";
import { z } from "zod";
import { AICompletionClient } from "../providers/client.js";

const PartitionContextualParams = z.object({});

/**
 * Partition documents and blobs using an AI model for contextual analysis.
 *
 * This action is a placeholder — it throws "not yet implemented"
 * until AI-based contextual partitioning support is added.
 */
export const partitionContextual = Action.withClient(
	"partition_contextual",
	AICompletionClient,
	{
		types: [Document],
		params: PartitionContextualParams,
		transform: transformPartitionContextual,
	},
);

// biome-ignore lint/correctness/useYield: stub action throws before yielding
async function* transformPartitionContextual(
	_stream: AsyncIterable<Document>,
	_params: z.infer<typeof PartitionContextualParams>,
	_client: AICompletionClient,
) {
	throw new RuntimeError("partition_contextual is not yet implemented", {
		source: "ai/partition_contextual",
		retryable: false,
	});
}
