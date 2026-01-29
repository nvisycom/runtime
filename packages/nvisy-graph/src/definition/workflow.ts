import type { NodeId } from "@nvisy/core";
import type { Edge } from "./edge.js";
import type { WorkflowMetadata } from "./metadata.js";
import type { Node } from "./node.js";

export interface WorkflowDefinition {
	nodes: Record<string, Node>;
	edges: Edge[];
	metadata: WorkflowMetadata;
}
