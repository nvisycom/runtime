import { Schema } from "effect";
import { ConcurrencyPolicy, RetryPolicy, TimeoutPolicy } from "./policy.js";

const NodeBase = Schema.Struct({
	id: Schema.UUID,
	retry: Schema.optional(RetryPolicy),
	timeout: Schema.optional(TimeoutPolicy),
	concurrency: Schema.optional(ConcurrencyPolicy),
});

export const SourceNode = Schema.extend(
	NodeBase,
	Schema.Struct({
		type: Schema.Literal("source"),
		connector: Schema.String,
		config: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	}),
);

export const ActionNode = Schema.extend(
	NodeBase,
	Schema.Struct({
		type: Schema.Literal("action"),
		action: Schema.String,
		config: Schema.optionalWith(Schema.Record({ key: Schema.String, value: Schema.Unknown }), {
			default: () => ({}),
		}),
	}),
);

export const TargetNode = Schema.extend(
	NodeBase,
	Schema.Struct({
		type: Schema.Literal("target"),
		connector: Schema.String,
		config: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
	}),
);

export const BranchRoute = Schema.Struct({
	predicate: Schema.String,
	target: Schema.String,
});

export const BranchNode = Schema.extend(
	NodeBase,
	Schema.Struct({
		type: Schema.Literal("branch"),
		routes: Schema.Array(BranchRoute),
		default: Schema.optional(Schema.String),
	}),
);

export const GraphNode = Schema.Union(
	SourceNode,
	ActionNode,
	TargetNode,
	BranchNode,
);

export const GraphEdge = Schema.Struct({
	from: Schema.UUID,
	to: Schema.UUID,
});

export type SourceNode = Schema.Schema.Type<typeof SourceNode>;
export type ActionNode = Schema.Schema.Type<typeof ActionNode>;
export type TargetNode = Schema.Schema.Type<typeof TargetNode>;
export type BranchNode = Schema.Schema.Type<typeof BranchNode>;
export type GraphNode = Schema.Schema.Type<typeof GraphNode>;
export type GraphEdge = Schema.Schema.Type<typeof GraphEdge>;
