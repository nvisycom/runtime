export interface EngineConfig {
	maxConcurrentRuns: number;
	defaultTimeoutMs: number;
	maxRetries: number;
	retryDelayMs: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
	maxConcurrentRuns: 10,
	defaultTimeoutMs: 3_600_000,
	maxRetries: 3,
	retryDelayMs: 1_000,
};
