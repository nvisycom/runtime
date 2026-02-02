import type { Data } from "@nvisy/core";
import { createQueue, type Queue } from "effection";

export interface Edge {
	readonly from: string;
	readonly to: string;
	readonly queue: Queue<Data, void>;
}

export const createEdge = (from: string, to: string): Edge => ({
	from,
	to,
	queue: createQueue<Data, void>(),
});
