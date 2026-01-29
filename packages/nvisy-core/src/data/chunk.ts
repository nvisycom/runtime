/** A chunk of text extracted from a document. */
export class ChunkData {
	readonly id: string;
	readonly text: string;
	readonly startOffset: number;
	readonly endOffset: number;
	readonly chunkIndex: number;
	readonly pageNumber?: number | undefined;
	readonly tokenCount?: number | undefined;
	readonly totalChunks?: number | undefined;
	readonly contextText?: string | undefined;
	readonly sourceIds?: readonly string[] | undefined;

	constructor(fields: {
		id: string;
		text: string;
		startOffset: number;
		endOffset: number;
		chunkIndex: number;
		pageNumber?: number;
		tokenCount?: number;
		totalChunks?: number;
		contextText?: string;
		sourceIds?: readonly string[];
	}) {
		this.id = fields.id;
		this.text = fields.text;
		this.startOffset = fields.startOffset;
		this.endOffset = fields.endOffset;
		this.chunkIndex = fields.chunkIndex;
		this.pageNumber = fields.pageNumber;
		this.tokenCount = fields.tokenCount;
		this.totalChunks = fields.totalChunks;
		this.contextText = fields.contextText;
		this.sourceIds = fields.sourceIds;
	}

	/** Character length of the chunk text. */
	get length(): number {
		return this.text.length;
	}
}
