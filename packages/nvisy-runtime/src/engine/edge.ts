import { Effect, Queue } from "effect";
import type { AnyData } from "@nvisy/core";

export interface Edge {
	readonly queue: Queue.Queue<AnyData>;
	readonly from: string;
	readonly to: string;
}

export const createEdge = (
	from: string,
	to: string,
	capacity = 256,
): Effect.Effect<Edge> =>
	Effect.map(Queue.bounded<AnyData>(capacity), (queue) => ({
		queue,
		from,
		to,
	}));
