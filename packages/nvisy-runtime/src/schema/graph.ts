import { Schema as S } from "effect";
import { GraphNode } from "./node.js";
import { ConcurrencyPolicy, TimeoutPolicy } from "./policy.js";

export const GraphDefinition = S.Struct({
	id: S.String,
	name: S.optional(S.String),
	description: S.optional(S.String),
	nodes: S.Array(GraphNode),
	concurrency: S.optional(ConcurrencyPolicy),
	timeout: S.optional(TimeoutPolicy),
	metadata: S.optionalWith(S.Record({ key: S.String, value: S.Unknown }), {
		default: () => ({}),
	}),
});

export type GraphDefinition = S.Schema.Type<typeof GraphDefinition>;
