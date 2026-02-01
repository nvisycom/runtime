import { Effect, Schedule } from "effect";
import type { Data } from "@nvisy/core";
import type { GraphNode } from "../schema/index.js";
import type { ResolvedNode } from "../compiler/plan.js";
import type { Edge } from "./edge.js";

export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly itemsProcessed: number;
}

/**
 * Execute a single graph node.
 *
 * @param node - The schema node (carries retry/timeout policies).
 * @param resolved - Pre-resolved registry entry from the plan.
 * @param inEdges - Edges feeding data into this node.
 * @param outEdges - Edges carrying data out of this node.
 */
export const executeNode = (
	node: GraphNode,
	resolved: ResolvedNode,
	inEdges: ReadonlyArray<Edge>,
	outEdges: ReadonlyArray<Edge>,
): Effect.Effect<NodeResult, Error> => {
	const base = Effect.gen(function* () {
		let itemsProcessed = 0;

		switch (resolved.type) {
			case "source": {
				// Connect to provider, read from source, push to outEdges
				const instance = yield* Effect.tryPromise(() =>
					resolved.provider.connect(resolved.config, resolved.config),
				).pipe(Effect.catchAll((e) => Effect.fail(new Error(`Source connect failed: ${String(e)}`))));

				// TODO: call instance.createSource().read() and push items to outEdges
				void instance;
				void outEdges;
				break;
			}
			case "action": {
				// Drain inEdges, execute action, push results to outEdges
				const items: Data[] = [];
				for (const edge of inEdges) {
					// TODO: drain queue until upstream signals completion
					void edge;
				}

				if (items.length > 0) {
					const results = yield* Effect.tryPromise(() =>
						resolved.action.execute(items, resolved.config),
					).pipe(Effect.catchAll((e) => Effect.fail(new Error(`Action execute failed: ${String(e)}`))));

					itemsProcessed = results.length;
					// TODO: push results to outEdges
					void outEdges;
				}
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
					const instance = yield* Effect.tryPromise(() =>
						resolved.provider.connect(resolved.config, resolved.config),
					).pipe(Effect.catchAll((e) => Effect.fail(new Error(`Target connect failed: ${String(e)}`))));

					// TODO: call instance.createSink().write(items)
					void instance;
					itemsProcessed = items.length;
				}
				break;
			}
			default:
				// branch — control flow handled by runner
				break;
		}

		return {
			nodeId: node.id,
			status: "success" as const,
			itemsProcessed,
		};
	});

	// ── Apply retry policy ─────────────────────────────────────────────
	const withRetry = node.retry
		? base.pipe(
			Effect.retry(
				(node.retry.backoff === "exponential"
					? Schedule.exponential(`${node.retry.initialDelayMs} millis`)
					: Schedule.fixed(`${node.retry.initialDelayMs} millis`)
				).pipe(Schedule.compose(Schedule.recurs(node.retry.maxRetries))),
			),
		)
		: base;

	// ── Apply timeout ──────────────────────────────────────────────────
	const timeoutMs = node.timeout?.nodeTimeoutMs;
	const withTimeout = timeoutMs
		? withRetry.pipe(
			Effect.timeout(`${timeoutMs} millis`),
			Effect.map((option) =>
				option ?? {
					nodeId: node.id,
					status: "failure" as const,
					error: new Error(`Node ${node.id} timed out after ${timeoutMs}ms`),
					itemsProcessed: 0,
				},
			),
		)
		: withRetry;

	return withTimeout;
};
