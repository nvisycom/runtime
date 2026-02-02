import { z } from "zod";
import { ConcurrencyPolicy, RetryPolicy, TimeoutPolicy } from "./policy.js";

const NodeBase = z.object({
	id: z.string().uuid(),
	retry: RetryPolicy.optional(),
	timeout: TimeoutPolicy.optional(),
	concurrency: ConcurrencyPolicy.optional(),
});

export const SourceNode = NodeBase.extend({
	type: z.literal("source"),
	connector: z.string(),
	config: z.record(z.string(), z.unknown()),
});

export const ActionNode = NodeBase.extend({
	type: z.literal("action"),
	action: z.string(),
	config: z.record(z.string(), z.unknown()).default({}),
});

export const TargetNode = NodeBase.extend({
	type: z.literal("target"),
	connector: z.string(),
	config: z.record(z.string(), z.unknown()),
});

export const BranchRoute = z.object({
	predicate: z.string(),
	target: z.string(),
});

export const BranchNode = NodeBase.extend({
	type: z.literal("branch"),
	routes: z.array(BranchRoute),
	default: z.string().optional(),
});

export const GraphNode = z.discriminatedUnion("type", [
	SourceNode,
	ActionNode,
	TargetNode,
	BranchNode,
]);

export const GraphEdge = z.object({
	from: z.string().uuid(),
	to: z.string().uuid(),
});

export type SourceNode = z.infer<typeof SourceNode>;
export type ActionNode = z.infer<typeof ActionNode>;
export type TargetNode = z.infer<typeof TargetNode>;
export type BranchNode = z.infer<typeof BranchNode>;
export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;
