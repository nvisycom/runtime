import { z } from "zod";
import { ConcurrencyPolicy, RetryPolicy, TimeoutPolicy } from "./policy.js";

const NodeBase = z.object({
	id: z.uuid(),
	retry: RetryPolicy.optional(),
	timeout: TimeoutPolicy.optional(),
	concurrency: ConcurrencyPolicy.optional(),
});

export const SourceNode = NodeBase.extend({
	type: z.literal("source"),
	provider: z.string(),
	params: z.record(z.string(), z.unknown()),
});

export const ActionNode = NodeBase.extend({
	type: z.literal("action"),
	action: z.string(),
	params: z.record(z.string(), z.unknown()).default({}),
});

export const TargetNode = NodeBase.extend({
	type: z.literal("target"),
	provider: z.string(),
	params: z.record(z.string(), z.unknown()),
});

export const GraphNode = z.discriminatedUnion("type", [
	SourceNode,
	ActionNode,
	TargetNode,
]);

export const GraphEdge = z.object({
	from: z.uuid(),
	to: z.uuid(),
});

export type SourceNode = z.infer<typeof SourceNode>;
export type ActionNode = z.infer<typeof ActionNode>;
export type TargetNode = z.infer<typeof TargetNode>;
export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;
