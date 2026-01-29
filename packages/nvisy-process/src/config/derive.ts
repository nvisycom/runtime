export enum DeriveTask {
	Summarization = "summarization",
	GenerateTitle = "generate_title",
	ChunkContext = "chunk_context",
}

export interface DeriveConfig {
	tasks: DeriveTask[];
}
