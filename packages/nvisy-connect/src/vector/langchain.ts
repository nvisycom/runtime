import { Embeddings } from "@langchain/core/embeddings";

/**
 * No-op embeddings implementation.
 *
 * Langchain vector store constructors require an `EmbeddingsInterface`,
 * but our connectors receive pre-computed vectors and call `addVectors`
 * directly — so the embed methods are never invoked at runtime.
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
