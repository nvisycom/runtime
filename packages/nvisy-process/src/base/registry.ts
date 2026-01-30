import type { Processor } from "./processor.js";

/** Maps processor kind strings to Processor implementations. */
export class ProcessorRegistry {
	readonly #processors = new Map<string, Processor>();

	register(kind: string, processor: Processor): void {
		this.#processors.set(kind, processor);
	}

	get(kind: string): Processor | undefined {
		return this.#processors.get(kind);
	}

	has(kind: string): boolean {
		return this.#processors.has(kind);
	}
}
