/** A chunk of text extracted from a document. */
export interface ChunkData {
	/** Unique chunk identifier. */
	id: string;
	/** The chunk text content. */
	text: string;
	/** Start offset in the original document (character position). */
	startOffset: number;
	/** End offset in the original document (character position). */
	endOffset: number;
	/** Page number where this chunk begins (1-based). */
	pageNumber?: number;
	/** Token count for the configured tokenizer. */
	tokenCount?: number;
	/** Index of this chunk in the sequence (0-based). */
	chunkIndex: number;
	/** Total number of chunks in the sequence. */
	totalChunks?: number;
	/** LLM-generated context for semantic search. */
	contextText?: string;
	/** Source element or document IDs that contributed to this chunk. */
	sourceIds?: string[];
}
