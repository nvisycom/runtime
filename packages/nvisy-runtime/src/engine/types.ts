import { z } from "zod";

/** Schema for a single connection entry. */
export const ConnectionSchema = z.object({
	/** Provider type identifier (e.g., "postgres", "s3"). */
	type: z.string(),
	/** Provider-specific credentials (validated against provider schema at runtime). */
	credentials: z.unknown(),
	/** Optional resumption context for crash recovery. */
	context: z.unknown(),
});

/** Schema for the connections map (UUID keys). */
export const ConnectionsSchema = z.record(z.uuid(), ConnectionSchema);

/** A connection entry with credentials for a specific provider. */
export type Connection = z.infer<typeof ConnectionSchema>;

/**
 * Map of connection ID (UUID) to connection configuration.
 *
 * Connections are referenced by nodes in the graph definition.
 * Each connection specifies credentials that are validated against
 * the provider's credential schema before execution.
 */
export type Connections = z.infer<typeof ConnectionsSchema>;

/** Reserved for future engine configuration options. */
export interface EngineConfig {}

/**
 * Options for graph execution.
 */
export interface ExecuteOptions {
	/** AbortSignal for cancellation support. */
	readonly signal?: AbortSignal;

	/**
	 * Callback invoked after each item is read from a source.
	 *
	 * Use this to persist resumption context for crash recovery.
	 * The context can be passed back via the connection's `context`
	 * field to resume from the last successful item.
	 *
	 * @param nodeId - The source node that produced the item.
	 * @param connectionId - The connection ID for the source.
	 * @param context - Provider-specific resumption context.
	 */
	readonly onContextUpdate?: (
		nodeId: string,
		connectionId: string,
		context: unknown,
	) => void;
}

/** Result of graph validation. */
export interface ValidationResult {
	/** True if the graph and connections are valid. */
	readonly valid: boolean;
	/** List of validation error messages (empty if valid). */
	readonly errors: ReadonlyArray<string>;
}

/** Result of executing a single node. */
export interface NodeResult {
	/** The node ID. */
	readonly nodeId: string;
	/** Execution status: success, failure, or skipped. */
	readonly status: "success" | "failure" | "skipped";
	/** Error details if status is "failure". */
	readonly error?: Error;
	/** Number of data items processed by this node. */
	readonly itemsProcessed: number;
}

/**
 * Result of executing a complete graph.
 *
 * The overall status is determined by individual node results:
 * - `success`: All nodes completed successfully.
 * - `partial_failure`: Some nodes failed, others succeeded.
 * - `failure`: All nodes failed.
 */
export interface RunResult {
	/** Unique identifier for this execution run. */
	readonly runId: string;
	/** Overall execution status. */
	readonly status: "success" | "partial_failure" | "failure";
	/** Results for each node in topological order. */
	readonly nodes: ReadonlyArray<NodeResult>;
}

/**
 * Lifecycle status of a background execution run.
 *
 * Transitions: pending → running → completed | failed | cancelled
 */
export type RunStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

/**
 * Complete state of an execution run.
 *
 * Includes per-node progress for monitoring long-running executions.
 */
export interface RunState {
	/** Unique identifier for this run. */
	readonly runId: string;
	/** Current lifecycle status. */
	readonly status: RunStatus;
	/** When the run was submitted. */
	readonly startedAt: Date;
	/** When the run finished (if completed, failed, or cancelled). */
	readonly completedAt?: Date;
	/** Progress for each node in the graph. */
	readonly nodeProgress: ReadonlyMap<string, NodeProgress>;
	/** Final result (present when status is "completed"). */
	readonly result?: RunResult;
	/** Error details (present when status is "failed"). */
	readonly error?: Error;
}

/** Progress of a single node within a run. */
export interface NodeProgress {
	/** The node ID. */
	readonly nodeId: string;
	/** Current execution status. */
	readonly status: "pending" | "running" | "completed" | "failed";
	/** Number of items processed so far. */
	readonly itemsProcessed: number;
	/** Error details if status is "failed". */
	readonly error?: Error;
}

/** Summary of a run for listing (without full progress details). */
export interface RunSummary {
	/** Unique identifier for this run. */
	readonly runId: string;
	/** Current lifecycle status. */
	readonly status: RunStatus;
	/** When the run was submitted. */
	readonly startedAt: Date;
	/** When the run finished (if applicable). */
	readonly completedAt?: Date;
}
