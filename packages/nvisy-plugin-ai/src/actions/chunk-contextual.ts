import { Action, Chunk, Document } from "@nvisy/core";
import { z } from "zod";
import { AICompletionClient } from "../providers/client.js";

const ChunkContextualParams = z.object({
	/** Maximum characters per chunk. Defaults to 2000. */
	maxChunkSize: z.number().default(2000),
});

/**
 * Split documents into semantically meaningful chunks using an LLM.
 *
 * Uses a language model to determine natural chunk boundaries.
 */
export const chunkContextual = Action.withClient(
	"chunk_contextual",
	AICompletionClient,
	{
		types: [Document, Chunk],
		params: ChunkContextualParams,
		transform: transformChunkContextual,
	},
);

async function* transformChunkContextual(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof ChunkContextualParams>,
	client: AICompletionClient,
) {
	for await (const doc of stream) {
		const texts = await chunkByContext(doc.content, params, client);

		for (let i = 0; i < texts.length; i++) {
			yield new Chunk(texts[i]!, {
				chunkIndex: i,
				chunkTotal: texts.length,
			}).deriveFrom(doc);
		}
	}
}

/** Use an LLM to determine natural chunk boundaries. */
async function chunkByContext(
	text: string,
	params: { maxChunkSize: number },
	client: AICompletionClient,
): Promise<string[]> {
	const result = await client.complete({
		messages: [
			{
				role: "system",
				content: `You are a text segmentation assistant. Split the following text into semantically coherent chunks. Each chunk should be at most ${params.maxChunkSize} characters. Return ONLY a JSON array of strings, where each string is one chunk. Do not add any explanation.`,
			},
			{
				role: "user",
				content: text,
			},
		],
	});

	try {
		const parsed = JSON.parse(result.content) as unknown;
		if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) {
			return parsed as string[];
		}
	} catch {
		// Fall back to returning the whole text as a single chunk
	}

	return [text];
}
