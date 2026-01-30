export enum PartitionStrategy {
	Auto = "auto",
	Fast = "fast",
	Slow = "slow",
	Vlm = "vlm",
}

export interface PartitionConfig {
	strategy: PartitionStrategy;
	includePageBreaks?: boolean;
	discardUnsupported?: boolean;
}
