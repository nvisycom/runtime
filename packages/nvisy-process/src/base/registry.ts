import type { Process } from "./process.js";

/** Maps processor kind strings to Process implementations. */
export class ProcessorRegistry {
	private readonly processors = new Map<string, Process>();

	register(kind: string, processor: Process): void {
		this.processors.set(kind, processor);
	}

	get(kind: string): Process | undefined {
		return this.processors.get(kind);
	}

	has(kind: string): boolean {
		return this.processors.has(kind);
	}
}
