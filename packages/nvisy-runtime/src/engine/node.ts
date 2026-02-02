import { getLogger } from "@logtape/logtape";
import type { Data } from "@nvisy/core";
import type { GraphNode } from "../schema/index.js";
import type { ResolvedNode } from "../compiler/plan.js";
import type { Edge } from "./edge.js";

const logger = getLogger(["nvisy", "engine"]);

export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly itemsProcessed: number;
}

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
	fn: () => Promise<T>,
	node: GraphNode,
): Promise<T> {
	if (!node.retry) return fn();

	const { maxRetries, backoff, initialDelayMs, maxDelayMs } = node.retry;
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			logger.warn("Node {nodeId} attempt {attempt} failed: {error}", {
				nodeId: node.id,
				attempt: attempt + 1,
				maxRetries,
				error: error instanceof Error ? error.message : String(error),
			});
			if (attempt < maxRetries) {
				let delay: number;
				if (backoff === "exponential") {
					delay = Math.min(initialDelayMs * 2 ** attempt, maxDelayMs);
				} else {
					delay = initialDelayMs;
				}
				if (backoff === "jitter") {
					delay = Math.min(initialDelayMs * 2 ** attempt, maxDelayMs) * Math.random();
				}
				await sleep(delay);
			}
		}
	}

	throw lastError;
}

async function withTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number | undefined,
	fallback: T,
): Promise<T> {
	if (!timeoutMs) return fn();

	return Promise.race([
		fn(),
		new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
	]);
}

/**
 * Execute a single graph node.
 *
 * @param node - The schema node (carries retry/timeout policies).
 * @param resolved - Pre-resolved registry entry from the plan.
 * @param inEdges - Edges feeding data into this node.
 * @param outEdges - Edges carrying data out of this node.
 */
export const executeNode = async (
	node: GraphNode,
	resolved: ResolvedNode,
	inEdges: ReadonlyArray<Edge>,
	outEdges: ReadonlyArray<Edge>,
): Promise<NodeResult> => {
	logger.debug("Executing node {nodeId} ({type})", { nodeId: node.id, type: resolved.type });

	const base = async (): Promise<NodeResult> => {
		let itemsProcessed = 0;

		switch (resolved.type) {
			case "source": {
				// Connect to provider, read from source, push to outEdges
				const instance = await resolved.provider.connect(resolved.config);
				try {
					// TODO: pipe resolved.stream.read(instance.client, ctx, params) to outEdges
					void instance;
					void outEdges;
				} finally {
					await instance.disconnect();
				}
				break;
			}
			case "action": {
				// TODO: convert inEdge queues to AsyncIterable, apply action.pipe(stream, config, client), push to outEdges
				void inEdges;
				void outEdges;
				break;
			}
			case "target": {
				// Drain inEdges, write to sink
				const items: Data[] = [];
				for (const edge of inEdges) {
					// TODO: drain queue until upstream signals completion
					void edge;
				}

				if (items.length > 0) {
					const instance = await resolved.provider.connect(resolved.config);
					try {
						// TODO: pipe data from inEdges into resolved.stream.write(instance.client, params)
						void instance;
						itemsProcessed = items.length;
					} finally {
						await instance.disconnect();
					}
				}
				break;
			}
			default:
				// branch -- control flow handled by runner
				break;
		}

		logger.debug("Node {nodeId} completed, {itemsProcessed} items processed", {
			nodeId: node.id,
			itemsProcessed,
		});

		return {
			nodeId: node.id,
			status: "success" as const,
			itemsProcessed,
		};
	};

	const timeoutMs = node.timeout?.nodeTimeoutMs;
	const timeoutFallback: NodeResult = {
		nodeId: node.id,
		status: "failure",
		error: new Error(`Node ${node.id} timed out after ${timeoutMs}ms`),
		itemsProcessed: 0,
	};

	return withTimeout(
		() => withRetry(base, node),
		timeoutMs,
		timeoutFallback,
	);
};
