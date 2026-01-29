/** Simple in-memory metrics collector. */
export class MetricsCollector {
	private readonly counters = new Map<string, number>();
	private readonly histograms = new Map<string, number[]>();

	incrementCounter(name: string, value = 1): void {
		this.counters.set(name, (this.counters.get(name) ?? 0) + value);
	}

	recordHistogram(name: string, value: number): void {
		const existing = this.histograms.get(name) ?? [];
		existing.push(value);
		this.histograms.set(name, existing);
	}

	getCounter(name: string): number {
		return this.counters.get(name) ?? 0;
	}

	getHistogram(name: string): number[] {
		return this.histograms.get(name) ?? [];
	}

	getAll(): {
		counters: Record<string, number>;
		histograms: Record<string, number[]>;
	} {
		return {
			counters: Object.fromEntries(this.counters),
			histograms: Object.fromEntries(this.histograms),
		};
	}
}
