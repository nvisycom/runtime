import type { MetricsCollector } from "./collector.js";

/** Formats collected metrics as Prometheus text exposition format. */
export function formatPrometheus(collector: MetricsCollector): string {
	const { counters, histograms } = collector.getAll();
	const lines: string[] = [];

	for (const [name, value] of Object.entries(counters)) {
		const metricName = sanitizeName(name);
		lines.push(`# TYPE ${metricName} counter`);
		lines.push(`${metricName} ${value}`);
	}

	for (const [name, values] of Object.entries(histograms)) {
		if (values.length === 0) continue;
		const metricName = sanitizeName(name);
		const sum = values.reduce((a, b) => a + b, 0);
		const count = values.length;
		lines.push(`# TYPE ${metricName} summary`);
		lines.push(`${metricName}_sum ${sum}`);
		lines.push(`${metricName}_count ${count}`);
	}

	return lines.join("\n") + "\n";
}

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_:]/g, "_");
}
