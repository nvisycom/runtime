import type { Data } from "@nvisy/core";

/**
 * Bounded async channel for passing data between nodes.
 */
export interface Edge {
	readonly from: string;
	readonly to: string;
	push(item: Data): Promise<void>;
	pull(): AsyncIterable<Data>;
	close(): void;
}

export const createEdge = (
	from: string,
	to: string,
	capacity = 256,
): Edge => {
	const buffer: Data[] = [];
	let closed = false;
	let pushResolve: (() => void) | undefined;
	let pullResolve: (() => void) | undefined;

	return {
		from,
		to,

		async push(item: Data): Promise<void> {
			while (buffer.length >= capacity && !closed) {
				await new Promise<void>((resolve) => {
					pushResolve = resolve;
				});
			}
			if (closed) return;
			buffer.push(item);
			if (pullResolve) {
				const resolve = pullResolve;
				pullResolve = undefined;
				resolve();
			}
		},

		async *pull(): AsyncIterable<Data> {
			while (true) {
				if (buffer.length > 0) {
					const item = buffer.shift()!;
					if (pushResolve) {
						const resolve = pushResolve;
						pushResolve = undefined;
						resolve();
					}
					yield item;
				} else if (closed) {
					return;
				} else {
					await new Promise<void>((resolve) => {
						pullResolve = resolve;
					});
				}
			}
		},

		close(): void {
			closed = true;
			if (pullResolve) {
				const resolve = pullResolve;
				pullResolve = undefined;
				resolve();
			}
			if (pushResolve) {
				const resolve = pushResolve;
				pushResolve = undefined;
				resolve();
			}
		},
	};
};
