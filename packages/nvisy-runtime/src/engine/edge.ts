import type { Data } from "@nvisy/core";
import { call, createQueue, type Operation, type Queue, spawn } from "effection";

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

/**
 * Bridge Effection edge queues into a single `ReadableStream<Data>`.
 *
 * A child operation drains each edge queue sequentially, writing items
 * into a `TransformStream`. The readable side is returned — it is
 * natively `AsyncIterable` in Node 22+.
 *
 * The drain loop stays inside Effection structured concurrency,
 * so halting the parent automatically cancels the drain.
 */
export function* edgesToIterable(
	edges: ReadonlyArray<Edge>,
): Operation<ReadableStream<Data>> {
	const { readable, writable } = new TransformStream<Data>();

	yield* spawn(function* () {
		const writer = writable.getWriter();
		try {
			for (const edge of edges) {
				let next = yield* edge.queue.next();
				while (!next.done) {
					yield* call(() => writer.write(next.value as Data));
					next = yield* edge.queue.next();
				}
			}
		} finally {
			yield* call(() => writer.close());
		}
	});

	return readable;
}
