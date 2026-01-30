import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import type { Embedding } from "@nvisy/core";

/**
 * No-op embeddings implementation.
 *
 * All our connectors receive pre-computed vectors from {@link Embedding}
 * instances and call `addVectors` directly, so the embeddings interface
 * is never invoked at runtime. Langchain vector stores require one at
 * construction time, however.
 */
export class NoopEmbeddings extends Embeddings {
	constructor() {
		super({});
	}

	embedDocuments(_documents: string[]): Promise<number[][]> {
		throw new Error("NoopEmbeddings.embedDocuments should never be called");
	}

	embedQuery(_document: string): Promise<number[]> {
		throw new Error("NoopEmbeddings.embedQuery should never be called");
	}
}

/**
 * Convert an array of {@link Embedding} items into the parallel arrays
 * that langchain's `addVectors` expects.
 */
export function toVectorsAndDocs(items: ReadonlyArray<Embedding>): {
	vectors: number[][];
	documents: Document[];
	ids: string[];
} {
	const vectors: number[][] = [];
	const documents: Document[] = [];
	const ids: string[] = [];

	for (const item of items) {
		vectors.push(Array.from(item.vector));
		documents.push(
			new Document({
				pageContent: "",
				metadata: item.metadata ?? {},
				id: item.id,
			}),
		);
		ids.push(item.id);
	}

	return { vectors, documents, ids };
}
