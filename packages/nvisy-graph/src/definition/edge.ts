import type { NodeId } from "@nvisy/core";

export interface Edge {
	from: NodeId;
	to: NodeId;
	fromPort?: string;
	toPort?: string;
}
