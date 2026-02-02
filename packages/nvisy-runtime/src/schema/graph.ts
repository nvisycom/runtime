import { z } from "zod";
import { GraphEdge, GraphNode } from "./node.js";
import { ConcurrencyPolicy, TimeoutPolicy } from "./policy.js";

export const GraphDefinition = z.object({
	id: z.uuid(),
	name: z.string().optional(),
	description: z.string().optional(),
	nodes: z.array(GraphNode),
	edges: z.array(GraphEdge).default([]),
	concurrency: ConcurrencyPolicy.optional(),
	timeout: TimeoutPolicy.optional(),
	metadata: z.record(z.string(), z.unknown()).default({}),
});

export type GraphDefinition = z.infer<typeof GraphDefinition>;
