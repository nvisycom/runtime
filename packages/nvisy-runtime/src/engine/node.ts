import { getLogger } from "@logtape/logtape";
import type { Data } from "@nvisy/core";
import { call, type Operation, race, sleep } from "effection";
import type { ResolvedNode } from "../compiler/plan.js";
import type { GraphNode } from "../schema/index.js";
import type { Edge } from "./edge.js";

const logger = getLogger(["nvisy", "engine"]);

export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly itemsProcessed: number;
}

function* withRetry<T>(fn: () => Operation<T>, node: GraphNode): Operation<T> {
	if (!node.retry) return yield* fn();

	const { maxRetries, backoff, initialDelayMs, maxDelayMs } = node.retry;
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return yield* fn();
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
					delay =
						Math.min(initialDelayMs * 2 ** attempt, maxDelayMs) * Math.random();
				}
				yield* sleep(delay);
			}
		}
	}

	throw lastError;
}

function* withTimeout<T>(
	fn: () => Operation<T>,
	timeoutMs: number | undefined,
	fallback: T,
): Operation<T> {
	if (!timeoutMs) return yield* fn();

	return yield* race([
		fn(),
		(function* (): Operation<T> {
			yield* sleep(timeoutMs);
			return fallback;
		})(),
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
export function* executeNode(
	node: GraphNode,
	resolved: ResolvedNode,
	inEdges: ReadonlyArray<Edge>,
	outEdges: ReadonlyArray<Edge>,
): Operation<NodeResult> {
	logger.debug("Executing node {nodeId} ({type})", {
		nodeId: node.id,
		type: resolved.type,
	});

	function* base(): Operation<NodeResult> {
		let itemsProcessed = 0;

		switch (resolved.type) {
			case "source": {
				const instance = yield* call(() =>
					resolved.provider.connect(resolved.params),
				);
				try {
					// TODO: pipe resolved.stream.read(instance.client, ctx, params) to outEdges
					void instance;
					void outEdges;
				} finally {
					yield* call(() => instance.disconnect());
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
				const items: Data[] = [];
				for (const edge of inEdges) {
					// TODO: drain queue until upstream signals completion
					void edge;
				}

				if (items.length > 0) {
					const instance = yield* call(() =>
						resolved.provider.connect(resolved.params),
					);
					try {
						// TODO: pipe data from inEdges into resolved.stream.write(instance.client, params)
						void instance;
						itemsProcessed = items.length;
					} finally {
						yield* call(() => instance.disconnect());
					}
				}
				break;
			}
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
	}

	const timeoutMs = node.timeout?.nodeTimeoutMs;
	const timeoutFallback: NodeResult = {
		nodeId: node.id,
		status: "failure",
		error: new Error(`Node ${node.id} timed out after ${timeoutMs}ms`),
		itemsProcessed: 0,
	};

	return yield* withTimeout(
		() => withRetry(base, node),
		timeoutMs,
		timeoutFallback,
	);
}
