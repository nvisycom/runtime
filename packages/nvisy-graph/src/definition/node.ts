import type { Input } from "./input.js";
import type { Output } from "./output.js";
import type { SwitchDef } from "./route/switch.js";
import type { TransformerDef } from "./transform.js";

export interface Position {
	x: number;
	y: number;
}

export type NodeKind =
	| { type: "input"; config: Input }
	| { type: "transform"; config: TransformerDef }
	| { type: "output"; config: Output }
	| { type: "switch"; config: SwitchDef };

export interface Node {
	name?: string;
	description?: string;
	position?: Position;
	kind: NodeKind;
}
