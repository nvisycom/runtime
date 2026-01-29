import type {
	ChunkConfig,
	ConvertConfig,
	DeriveConfig,
	EmbeddingConfig,
	EnrichConfig,
	ExtractConfig,
	MetadataConfig,
	PartitionConfig,
} from "@nvisy/process";

export type TransformerDef =
	| { kind: "partition"; config: PartitionConfig }
	| { kind: "chunk"; config: ChunkConfig }
	| { kind: "embedding"; config: EmbeddingConfig }
	| { kind: "enrich"; config: EnrichConfig }
	| { kind: "extract"; config: ExtractConfig }
	| { kind: "derive"; config: DeriveConfig }
	| { kind: "convert"; config: ConvertConfig }
	| { kind: "metadata"; config: MetadataConfig };
