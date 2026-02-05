/**
 * Execution context and connection validation.
 *
 * This module provides:
 * - Upfront validation of all connections before execution starts
 * - Edge graph construction for data flow between nodes
 * - ExecutionContext that carries validated state through execution
 */

import type { AnyProviderFactory, Data } from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { createQueue, type Queue } from "effection";
import type { ExecutionPlan } from "../compiler/index.js";
import type {
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "../compiler/plan.js";
import type { GraphNode } from "../schema.js";
import type { Connections, ExecuteOptions } from "./types.js";

/**
 * An edge in the execution graph.
 *
 * Edges connect nodes and carry data via an Effection queue.
 * The queue enables backpressure-aware streaming between nodes.
 */
export interface Edge {
	/** Source node ID. */
	readonly from: string;
	/** Target node ID. */
	readonly to: string;
	/** Queue for streaming data items between nodes. */
	readonly queue: Queue<Data, void>;
}

/**
 * A connection with validated credentials.
 *
 * Created during upfront validation, credentials have been parsed
 * against the provider's schema and are ready for use.
 */
export interface ValidatedConnection {
	/** The provider factory for creating client instances. */
	readonly provider: AnyProviderFactory;
	/** Validated credentials (already parsed against provider schema). */
	readonly credentials: unknown;
	/** Optional resumption context for crash recovery. */
	readonly context: unknown;
}

/**
 * Context passed through the execution of a graph.
 *
 * Provides access to the execution plan, validated connections,
 * edge queues, and helper methods for retrieving node information.
 */
export interface ExecutionContext {
	/** Unique identifier for this execution run. */
	readonly runId: string;
	/** The compiled execution plan. */
	readonly plan: ExecutionPlan;
	/** Validated connections keyed by connection ID. */
	readonly connections: ReadonlyMap<string, ValidatedConnection>;
	/** Incoming edges for each node (data flowing into the node). */
	readonly inEdges: ReadonlyMap<string, Edge[]>;
	/** Outgoing edges for each node (data flowing out of the node). */
	readonly outEdges: ReadonlyMap<string, Edge[]>;
	/** Execution options (signal, callbacks). */
	readonly options: ExecuteOptions | undefined;

	/** Get the graph node schema by ID. */
	getNode(nodeId: string): GraphNode;
	/** Get the resolved node (with provider/action references) by ID. */
	getResolved(nodeId: string): ResolvedNode;
	/** Get the validated connection for a node. */
	getConnection(nodeId: string): ValidatedConnection;
}

interface ResolvedWithConnection {
	readonly provider: AnyProviderFactory;
	readonly connection: string;
}

function hasConnection(
	resolved: ResolvedNode,
): resolved is (ResolvedSourceNode | ResolvedTargetNode | ResolvedActionNode) &
	ResolvedWithConnection {
	return "connection" in resolved && resolved.connection !== undefined;
}

/**
 * Validate all connections referenced by the execution plan.
 *
 * Performs upfront validation of credentials against provider schemas.
 * This ensures all connections are valid before execution begins,
 * avoiding partial execution failures due to credential issues.
 *
 * @param plan - The compiled execution plan.
 * @param connections - Raw connections from the caller.
 * @returns Map of connection ID to validated connection.
 * @throws ValidationError if any connection is missing or invalid.
 */
export function validateConnections(
	plan: ExecutionPlan,
	connections: Connections,
): Map<string, ValidatedConnection> {
	const validated = new Map<string, ValidatedConnection>();
	const errors: string[] = [];

	for (const nodeId of plan.order) {
		const resolved = plan.resolved.get(nodeId);
		if (!resolved || !hasConnection(resolved)) continue;

		const connId = resolved.connection;
		if (validated.has(connId)) continue;

		const conn = connections[connId];
		if (!conn) {
			errors.push(`Missing connection "${connId}" for node ${nodeId}`);
			continue;
		}

		const result = resolved.provider.credentialSchema.safeParse(
			conn.credentials,
		);
		if (!result.success) {
			errors.push(
				`Invalid credentials for connection "${connId}": ${result.error.message}`,
			);
			continue;
		}

		validated.set(connId, {
			provider: resolved.provider,
			credentials: result.data,
			context: conn.context,
		});
	}

	if (errors.length > 0) {
		throw new ValidationError(errors.join("; "), {
			source: "engine",
			retryable: false,
			details: { errors },
		});
	}

	return validated;
}

/**
 * Build edge maps from the execution plan.
 *
 * Creates Effection queues for each edge in the graph.
 * These queues enable backpressure-aware streaming between nodes.
 *
 * @param plan - The compiled execution plan.
 * @returns Maps of incoming and outgoing edges for each node.
 */
export function buildEdges(plan: ExecutionPlan): {
	inEdges: Map<string, Edge[]>;
	outEdges: Map<string, Edge[]>;
} {
	const inEdges = new Map<string, Edge[]>();
	const outEdges = new Map<string, Edge[]>();

	for (const id of plan.order) {
		inEdges.set(id, []);
		outEdges.set(id, []);
	}

	for (const entry of plan.graph.edgeEntries()) {
		const edge: Edge = {
			from: entry.source,
			to: entry.target,
			queue: createQueue<Data, void>(),
		};
		outEdges.get(entry.source)!.push(edge);
		inEdges.get(entry.target)!.push(edge);
	}

	return { inEdges, outEdges };
}

/**
 * Create an execution context for a graph run.
 *
 * The context carries all validated state needed for execution
 * and provides helper methods for accessing node information.
 *
 * @param runId - Unique identifier for this run.
 * @param plan - The compiled execution plan.
 * @param connections - Validated connections.
 * @param inEdges - Incoming edge map.
 * @param outEdges - Outgoing edge map.
 * @param options - Execution options.
 */
export function createContext(
	runId: string,
	plan: ExecutionPlan,
	connections: ReadonlyMap<string, ValidatedConnection>,
	inEdges: ReadonlyMap<string, Edge[]>,
	outEdges: ReadonlyMap<string, Edge[]>,
	options?: ExecuteOptions,
): ExecutionContext {
	return {
		runId,
		plan,
		connections,
		inEdges,
		outEdges,
		options,

		getNode(nodeId: string): GraphNode {
			const node = plan.graph.getNodeAttributes(nodeId).schema;
			if (!node) {
				throw new ValidationError(`Node not found: ${nodeId}`, {
					source: "engine",
					retryable: false,
				});
			}
			return node;
		},

		getResolved(nodeId: string): ResolvedNode {
			const resolved = plan.resolved.get(nodeId);
			if (!resolved) {
				throw new ValidationError(`Resolved node not found: ${nodeId}`, {
					source: "engine",
					retryable: false,
				});
			}
			return resolved;
		},

		getConnection(nodeId: string): ValidatedConnection {
			const resolved = plan.resolved.get(nodeId);
			if (!resolved || !hasConnection(resolved)) {
				throw new ValidationError(`Node ${nodeId} has no connection`, {
					source: "engine",
					retryable: false,
				});
			}
			const conn = connections.get(resolved.connection);
			if (!conn) {
				throw new ValidationError(
					`Connection not found: ${resolved.connection}`,
					{ source: "engine", retryable: false },
				);
			}
			return conn;
		},
	};
}
