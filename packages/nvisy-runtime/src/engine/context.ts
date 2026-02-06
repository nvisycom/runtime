/**
 * Execution context and edge graph construction.
 *
 * Provides the runtime context that carries validated state through
 * execution, and builds edge queues for data flow between nodes.
 */

import type { Data } from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { createQueue, type Queue } from "effection";
import type { ExecutionPlan } from "../compiler/index.js";
import type { ResolvedNode } from "../compiler/plan.js";
import type { Registry } from "../registry.js";
import type { GraphNode } from "../schema.js";
import type { LoaderCache } from "./bridge.js";
import type { ValidatedConnection } from "./connections.js";
import type { ExecuteOptions } from "./executor.js";

/**
 * An edge in the execution graph.
 *
 * Edges connect nodes and carry data via an Effection queue.
 * The queue enables backpressure-aware streaming between nodes.
 */
export interface Edge {
	readonly from: string;
	readonly to: string;
	readonly queue: Queue<Data, void>;
}

/**
 * Context passed through the execution of a graph.
 *
 * Provides access to the execution plan, validated connections,
 * edge queues, and helper methods for retrieving node information.
 */
export interface ExecutionContext {
	readonly runId: string;
	readonly plan: ExecutionPlan;
	readonly connections: ReadonlyMap<string, ValidatedConnection>;
	readonly inEdges: ReadonlyMap<string, Edge[]>;
	readonly outEdges: ReadonlyMap<string, Edge[]>;
	readonly options: ExecuteOptions | undefined;
	readonly registry: Registry;
	readonly loaderCache: LoaderCache;

	getNode(nodeId: string): GraphNode;
	getResolved(nodeId: string): ResolvedNode;
	getConnection(nodeId: string): ValidatedConnection;
}

/** Configuration for creating an execution context. */
export interface ContextConfig {
	readonly runId: string;
	readonly plan: ExecutionPlan;
	readonly connections: ReadonlyMap<string, ValidatedConnection>;
	readonly inEdges: ReadonlyMap<string, Edge[]>;
	readonly outEdges: ReadonlyMap<string, Edge[]>;
	readonly registry: Registry;
	readonly loaderCache: LoaderCache;
	readonly options?: ExecuteOptions;
}

/**
 * Build edge maps from the execution plan.
 *
 * Creates Effection queues for each edge in the graph.
 * These queues enable backpressure-aware streaming between nodes.
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

/** Create an execution context for a graph run. */
export function createContext(config: ContextConfig): ExecutionContext {
	const {
		runId,
		plan,
		connections,
		inEdges,
		outEdges,
		registry,
		loaderCache,
		options,
	} = config;

	return {
		runId,
		plan,
		connections,
		inEdges,
		outEdges,
		options,
		registry,
		loaderCache,

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
			if (!resolved || !("connection" in resolved) || !resolved.connection) {
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
