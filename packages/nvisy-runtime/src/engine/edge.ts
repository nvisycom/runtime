import { Effect, Queue } from "effect";
import type { Data } from "@nvisy/core";

export interface Edge {
	readonly queue: Queue.Queue<Data>;
	readonly from: string;
	readonly to: string;
}

export const createEdge = (
	from: string,
	to: string,
	capacity = 256,
): Effect.Effect<Edge> =>
	Effect.map(Queue.bounded<Data>(capacity), (queue) => ({
		queue,
		from,
		to,
	}));
