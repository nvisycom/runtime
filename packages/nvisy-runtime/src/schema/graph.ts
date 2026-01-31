import { Schema } from "effect";
import { GraphEdge, GraphNode } from "./node.js";
import { ConcurrencyPolicy, TimeoutPolicy } from "./policy.js";

export const GraphDefinition = Schema.Struct({
	id: Schema.UUID,
	name: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	nodes: Schema.Array(GraphNode),
	edges: Schema.optionalWith(Schema.Array(GraphEdge), { default: () => [] }),
	concurrency: Schema.optional(ConcurrencyPolicy),
	timeout: Schema.optional(TimeoutPolicy),
	metadata: Schema.optionalWith(Schema.Record({ key: Schema.String, value: Schema.Unknown }), {
		default: () => ({}),
	}),
});

export type GraphDefinition = Schema.Schema.Type<typeof GraphDefinition>;
