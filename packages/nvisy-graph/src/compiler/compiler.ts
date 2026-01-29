import type { WorkflowDefinition } from "../definition/workflow.js";
import type { CompiledGraph } from "../graph/compiled-graph.js";
import type { CompiledNode } from "../graph/compiled-node.js";
import { topologicalSort } from "../graph/topological.js";
import { resolveCacheSlots } from "./cache-resolver.js";
import { validateWorkflow } from "./validator.js";

export class WorkflowCompiler {
	compile(def: WorkflowDefinition): CompiledGraph {
		// Step 1: Validate the workflow definition
		validateWorkflow(def);

		// Step 2: Resolve cache slots into direct edges
		const resolvedEdges = resolveCacheSlots(def);

		// Step 3: Compute execution order via topological sort
		const nodeIds = Object.keys(def.nodes);
		const edgesForSort = resolvedEdges.map((e) => ({
			from: String(e.from),
			to: String(e.to),
		}));
		const executionOrder = topologicalSort(nodeIds, edgesForSort);
		if (executionOrder === null) {
			throw new Error(
				"Failed to determine execution order: cycle detected after resolution",
			);
		}

		// Step 4: Compile individual nodes (STUB)
		const nodes = new Map<string, CompiledNode>();
		// TODO: Implement node compilation — instantiate Process, DataInput, DataOutput, etc.

		return {
			nodes,
			executionOrder,
			edges: resolvedEdges.map((e) => ({
				from: String(e.from),
				to: String(e.to),
				fromPort: e.fromPort,
				toPort: e.toPort,
			})),
		};
	}
}
