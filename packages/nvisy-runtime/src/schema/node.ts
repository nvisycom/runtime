import { Schema as S } from "effect";
import { RetryPolicy } from "./policy.js";

const NodeBase = S.Struct({
	id: S.String,
	dependsOn: S.optionalWith(S.Array(S.String), { default: () => [] }),
	retry: S.optional(RetryPolicy),
	timeoutMs: S.optional(S.Number),
	concurrency: S.optional(S.Number),
});

export const SourceNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("source"),
		connector: S.String,
		config: S.Record({ key: S.String, value: S.Unknown }),
	}),
);

export const ActionNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("action"),
		action: S.String,
		config: S.optionalWith(S.Record({ key: S.String, value: S.Unknown }), {
			default: () => ({}),
		}),
	}),
);

export const SinkNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("sink"),
		connector: S.String,
		config: S.Record({ key: S.String, value: S.Unknown }),
	}),
);

export const BranchRoute = S.Struct({
	predicate: S.String,
	target: S.String,
});

export const BranchNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("branch"),
		routes: S.Array(BranchRoute),
		default: S.optional(S.String),
	}),
);

export const FanOutNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("fanout"),
		targets: S.Array(S.String),
	}),
);

export const FanInNode = S.extend(
	NodeBase,
	S.Struct({
		type: S.Literal("fanin"),
		sources: S.Array(S.String),
		materialize: S.optionalWith(S.Boolean, { default: () => false }),
	}),
);

export const GraphNode = S.Union(
	SourceNode,
	ActionNode,
	SinkNode,
	BranchNode,
	FanOutNode,
	FanInNode,
);

export type SourceNode = S.Schema.Type<typeof SourceNode>;
export type ActionNode = S.Schema.Type<typeof ActionNode>;
export type SinkNode = S.Schema.Type<typeof SinkNode>;
export type BranchNode = S.Schema.Type<typeof BranchNode>;
export type FanOutNode = S.Schema.Type<typeof FanOutNode>;
export type FanInNode = S.Schema.Type<typeof FanInNode>;
export type GraphNode = S.Schema.Type<typeof GraphNode>;
