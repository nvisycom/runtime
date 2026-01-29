export type ChunkStrategy =
	| { strategy: "character"; maxCharacters: number; overlapCharacters: number }
	| { strategy: "page"; overlapPages: number }
	| {
			strategy: "section";
			minCharacters: number;
			maxCharacters: number;
			overlapCharacters: number;
	  }
	| { strategy: "similarity"; maxCharacters: number; score: number };

export interface ChunkConfig {
	chunkStrategy: ChunkStrategy;
	contextualChunking?: boolean;
}
