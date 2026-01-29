import type { DataInput, DataOutput } from "@nvisy/connect";
import type { Process } from "@nvisy/process";

export type CompiledNode =
	| { type: "input"; read: DataInput<unknown, unknown> }
	| { type: "transform"; process: Process }
	| { type: "output"; write: DataOutput<unknown> }
	| { type: "switch"; evaluate: (input: unknown) => boolean };
