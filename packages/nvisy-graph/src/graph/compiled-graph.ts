import type { CompiledNode } from "./compiled-node.js";

export interface CompiledGraph {
	nodes: Map<string, CompiledNode>;
	executionOrder: string[];
	edges: Array<{
		from: string;
		to: string;
		fromPort?: string;
		toPort?: string;
	}>;
}
