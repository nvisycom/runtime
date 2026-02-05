import { z } from "zod";

export const ConnectionSchema = z.object({
	type: z.string(),
	credentials: z.unknown(),
	context: z.unknown(),
});
export const ConnectionsSchema = z.record(z.uuid(), ConnectionSchema);

export type Connection = z.infer<typeof ConnectionSchema>;
export type Connections = z.infer<typeof ConnectionsSchema>;

export interface EngineConfig {}

export interface ExecuteOptions {
	readonly signal?: AbortSignal;
	readonly onContextUpdate?: (
		nodeId: string,
		connectionId: string,
		context: unknown,
	) => void;
}

export interface ValidationResult {
	readonly valid: boolean;
	readonly errors: ReadonlyArray<string>;
}

export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly itemsProcessed: number;
}

export interface RunResult {
	readonly runId: string;
	readonly status: "success" | "partial_failure" | "failure";
	readonly nodes: ReadonlyArray<NodeResult>;
}
