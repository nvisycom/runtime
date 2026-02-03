import { z } from "zod";

/** Strategy for calculating delay between retry attempts. */
export const BackoffStrategy = z.enum(["fixed", "exponential", "jitter"]);

/** Controls how failed operations are retried. */
export const RetryPolicy = z.object({
	/** Maximum number of retry attempts after the initial failure. */
	maxRetries: z.number().default(3),
	/** Strategy for calculating delay between attempts. */
	backoff: BackoffStrategy.default("exponential"),
	/** Delay before the first retry in milliseconds. */
	initialDelayMs: z.number().default(1000),
	/** Maximum delay between retries in milliseconds. */
	maxDelayMs: z.number().default(30_000),
});

/** Controls execution time limits for nodes and graphs. */
export const TimeoutPolicy = z.object({
	/** Maximum execution time for a single node in milliseconds. */
	nodeTimeoutMs: z.number().optional(),
	/** Maximum execution time for the entire graph in milliseconds. */
	graphTimeoutMs: z.number().optional(),
});

/** Controls parallel execution limits. */
export const ConcurrencyPolicy = z.object({
	/** Maximum number of nodes executing concurrently across the graph. */
	maxGlobal: z.number().default(10),
	/** Maximum concurrent operations within a single node. */
	maxPerNode: z.number().optional(),
});

export type BackoffStrategy = z.infer<typeof BackoffStrategy>;
export type RetryPolicy = z.infer<typeof RetryPolicy>;
export type TimeoutPolicy = z.infer<typeof TimeoutPolicy>;
export type ConcurrencyPolicy = z.infer<typeof ConcurrencyPolicy>;

/** Common properties shared by all node types. */
const NodeBase = z.object({
	/** Unique identifier for the node. */
	id: z.uuid(),
	/** Retry policy for this node. Overrides graph-level policy. */
	retry: RetryPolicy.optional(),
	/** Timeout policy for this node. Overrides graph-level policy. */
	timeout: TimeoutPolicy.optional(),
	/** Concurrency policy for this node. Overrides graph-level policy. */
	concurrency: ConcurrencyPolicy.optional(),
});

/** A source node reads data from an external system. */
export const SourceNode = NodeBase.extend({
	/** Discriminator for source nodes. */
	type: z.literal("source"),
	/** Provider identifier in "module/name" format. */
	provider: z.string(),
	/** Stream identifier in "module/name" format. */
	stream: z.string(),
	/** UUID reference to a connection in the connections map. */
	credentials: z.uuid(),
	/** Stream-specific configuration parameters. */
	params: z.record(z.string(), z.unknown()),
});

/** An action node transforms data flowing through the graph. */
export const ActionNode = NodeBase.extend({
	/** Discriminator for action nodes. */
	type: z.literal("action"),
	/** Action identifier in "module/name" format. */
	action: z.string(),
	/** Action-specific configuration parameters. */
	params: z.record(z.string(), z.unknown()).default({}),
});

/** A target node writes data to an external system. */
export const TargetNode = NodeBase.extend({
	/** Discriminator for target nodes. */
	type: z.literal("target"),
	/** Provider identifier in "module/name" format. */
	provider: z.string(),
	/** Stream identifier in "module/name" format. */
	stream: z.string(),
	/** UUID reference to a connection in the connections map. */
	credentials: z.uuid(),
	/** Stream-specific configuration parameters. */
	params: z.record(z.string(), z.unknown()),
});

/** A node in the execution graph. Can be a source, action, or target. */
export const GraphNode = z.discriminatedUnion("type", [
	SourceNode,
	ActionNode,
	TargetNode,
]);

/** A directed edge connecting two nodes in the graph. */
export const GraphEdge = z.object({
	/** UUID of the source node. */
	from: z.uuid(),
	/** UUID of the target node. */
	to: z.uuid(),
});

export type SourceNode = z.infer<typeof SourceNode>;
export type ActionNode = z.infer<typeof ActionNode>;
export type TargetNode = z.infer<typeof TargetNode>;
export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;

/**
 * A complete graph definition describing a data pipeline.
 *
 * The graph is a directed acyclic graph (DAG) where source nodes produce data,
 * action nodes transform data, target nodes consume data, and edges define
 * data flow between nodes.
 */
export const Graph = z.object({
	/** Unique identifier for the graph. */
	id: z.uuid(),
	/** Human-readable name for the graph. */
	name: z.string().optional(),
	/** Description of what the graph does. */
	description: z.string().optional(),
	/** Nodes in the graph. */
	nodes: z.array(GraphNode),
	/** Edges connecting nodes. Defines data flow direction. */
	edges: z.array(GraphEdge).default([]),
	/** Graph-level concurrency policy. Can be overridden per-node. */
	concurrency: ConcurrencyPolicy.optional(),
	/** Graph-level timeout policy. Can be overridden per-node. */
	timeout: TimeoutPolicy.optional(),
	/** Arbitrary metadata attached to the graph. */
	metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Graph = z.infer<typeof Graph>;
