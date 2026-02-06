import { Action, Document, Embedding } from "@nvisy/core";
import { z } from "zod";
import { EmbeddingClient } from "../providers/client.js";

const EmbedParams = z.object({
	/** Desired embedding dimensions (if supported by the model). */
	dimensions: z.number().optional(),
	/** Number of documents to embed per API call. */
	batchSize: z.number().default(64),
});

/**
 * Generate embeddings for documents using an AI provider.
 *
 * Consumes {@link Document} items, batches their content, calls the
 * provider's embedding API, and yields one {@link Embedding} per document.
 */
export const embed = Action.withClient("embed", EmbeddingClient, {
	types: [Document, Embedding],
	params: EmbedParams,
	transform: transformEmbed,
});

async function* transformEmbed(
	stream: AsyncIterable<Document>,
	params: z.infer<typeof EmbedParams>,
	client: EmbeddingClient,
) {
	let batch: Document[] = [];

	for await (const doc of stream) {
		batch.push(doc);
		if (batch.length >= params.batchSize) {
			yield* emitBatch(batch, client, params.dimensions);
			batch = [];
		}
	}

	if (batch.length > 0) {
		yield* emitBatch(batch, client, params.dimensions);
	}
}

async function* emitBatch(
	batch: Document[],
	client: EmbeddingClient,
	dimensions: number | undefined,
): AsyncIterable<Embedding> {
	const texts = batch.map((doc) => doc.content);

	const vectors = await client.embed(texts, {
		...(dimensions != null ? { dimensions } : {}),
	});

	for (let i = 0; i < batch.length; i++) {
		const doc = batch[i]!;
		const vector = vectors[i]!;
		yield new Embedding(vector).deriveFrom(doc);
	}
}
