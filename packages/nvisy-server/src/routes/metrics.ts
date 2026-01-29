import { Hono } from "hono";
import type { MetricsCollector } from "../metrics/collector.js";
import { formatPrometheus } from "../metrics/prometheus.js";

export function createMetricsRoute(collector: MetricsCollector): Hono {
	const metrics = new Hono();

	metrics.get("/metrics", (c) => {
		const body = formatPrometheus(collector);
		return c.text(body, 200, {
			"content-type": "text/plain; version=0.0.4; charset=utf-8",
		});
	});

	return metrics;
}
