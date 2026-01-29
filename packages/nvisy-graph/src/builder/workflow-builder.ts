import { type NodeId, newNodeId } from "@nvisy/core";
import type { Edge } from "../definition/edge.js";
import type { Input } from "../definition/input.js";
import type { WorkflowMetadata } from "../definition/metadata.js";
import type { Node, NodeKind } from "../definition/node.js";
import type { Output } from "../definition/output.js";
import type { SwitchDef } from "../definition/route/switch.js";
import type { TransformerDef } from "../definition/transform.js";
import type { WorkflowDefinition } from "../definition/workflow.js";

export class WorkflowBuilder {
	private nodes = new Map<string, { id: NodeId; node: Node }>();
	private edges: Edge[] = [];
	private metadata: WorkflowMetadata;
	private aliasToId = new Map<string, NodeId>();

	constructor(name: string, description?: string) {
		this.metadata = {
			name,
			description,
			tags: [],
			createdAt: new Date().toISOString(),
		};
	}

	addInput(
		alias: string,
		config: Input,
		options?: { name?: string; description?: string },
	): this {
		const id = newNodeId();
		this.aliasToId.set(alias, id);
		this.nodes.set(alias, {
			id,
			node: {
				name: options?.name ?? alias,
				description: options?.description,
				kind: { type: "input", config },
			},
		});
		return this;
	}

	addTransform(
		alias: string,
		config: TransformerDef,
		options?: { name?: string; description?: string },
	): this {
		const id = newNodeId();
		this.aliasToId.set(alias, id);
		this.nodes.set(alias, {
			id,
			node: {
				name: options?.name ?? alias,
				description: options?.description,
				kind: { type: "transform", config },
			},
		});
		return this;
	}

	addOutput(
		alias: string,
		config: Output,
		options?: { name?: string; description?: string },
	): this {
		const id = newNodeId();
		this.aliasToId.set(alias, id);
		this.nodes.set(alias, {
			id,
			node: {
				name: options?.name ?? alias,
				description: options?.description,
				kind: { type: "output", config },
			},
		});
		return this;
	}

	addSwitch(
		alias: string,
		config: SwitchDef,
		options?: { name?: string; description?: string },
	): this {
		const id = newNodeId();
		this.aliasToId.set(alias, id);
		this.nodes.set(alias, {
			id,
			node: {
				name: options?.name ?? alias,
				description: options?.description,
				kind: { type: "switch", config },
			},
		});
		return this;
	}

	connect(from: string, to: string, fromPort?: string, toPort?: string): this {
		const fromId = this.aliasToId.get(from);
		const toId = this.aliasToId.get(to);
		if (!fromId) throw new Error(`Unknown node alias: ${from}`);
		if (!toId) throw new Error(`Unknown node alias: ${to}`);
		this.edges.push({ from: fromId, to: toId, fromPort, toPort });
		return this;
	}

	withTags(tags: string[]): this {
		this.metadata.tags = tags;
		return this;
	}

	build(): WorkflowDefinition {
		const nodes: Record<string, Node> = {};
		for (const [, { id, node }] of this.nodes) {
			nodes[id] = node;
		}
		return {
			nodes,
			edges: this.edges,
			metadata: this.metadata,
		};
	}
}
