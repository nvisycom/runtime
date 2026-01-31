import { Effect } from "effect";
import type { GraphNode } from "../schema/index.js";

export interface NodeResult {
	readonly nodeId: string;
	readonly status: "success" | "failure" | "skipped";
	readonly error?: Error;
	readonly primitivesProcessed: number;
}

export const executeNode = (
	_node: GraphNode,
): Effect.Effect<NodeResult, Error> =>
	Effect.gen(function* () {
		// TODO: resolve node type, wrap source/action/sink in fiber
		// TODO: wire input/output queues
		// TODO: apply retry policy via Effect.retry + Schedule
		// TODO: apply timeout via Effect.timeout
		return {
			nodeId: _node.id,
			status: "success" as const,
			primitivesProcessed: 0,
		};
	});
