import { Action, Document } from "@nvisy/core";
import { z } from "zod";
import { Chunk } from "../datatypes/index.js";
import { EmbeddingClient } from "../providers/client.js";

const ChunkSimilarityParams = z.object({
	/** Cosine similarity threshold for splitting (0-1). Defaults to 0.5. */
	threshold: z.number().min(0).max(1).default(0.5),
});

/**
 * Split documents into semantically meaningful chunks using embedding similarity.
 *
 * Computes embeddings for sentences and splits where cosine
 * similarity drops below a threshold.
 */
export const chunkSimilarity = Action.withClient(
	"chunk_similarity",
	EmbeddingClient,
	{
		types: [Document, Chunk],
		params: ChunkSimilarityParams,
		transform: transformChunkSimilarity,
	},
);

async function* transformChunkSimilarity(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof ChunkSimilarityParams>,
	client: EmbeddingClient,
) {
	for await (const doc of stream) {
		const texts = await chunkBySimilarity(doc.content, params, client);

		for (let i = 0; i < texts.length; i++) {
			yield new Chunk(texts[i]!, {
				chunkIndex: i,
				chunkTotal: texts.length,
			}).deriveFrom(doc);
		}
	}
}

/** Split sentences into semantic groups by embedding similarity. */
async function chunkBySimilarity(
	text: string,
	params: { threshold: number },
	client: EmbeddingClient,
): Promise<string[]> {
	const sentences = splitSentences(text);
	if (sentences.length <= 1) return [text];

	const vectors = await client.embed(sentences, {});

	const chunks: string[] = [];
	let current: string[] = [sentences[0]!];

	for (let i = 1; i < sentences.length; i++) {
		const sim = cosineSimilarity(vectors[i - 1]!, vectors[i]!);
		if (sim < params.threshold) {
			chunks.push(current.join(" "));
			current = [];
		}
		current.push(sentences[i]!);
	}
	if (current.length > 0) {
		chunks.push(current.join(" "));
	}

	return chunks;
}

function splitSentences(text: string): string[] {
	return text
		.split(/(?<=[.!?])\s+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i]! * b[i]!;
		normA += a[i]! * a[i]!;
		normB += b[i]! * b[i]!;
	}
	const denom = Math.sqrt(normA) * Math.sqrt(normB);
	return denom === 0 ? 0 : dot / denom;
}
