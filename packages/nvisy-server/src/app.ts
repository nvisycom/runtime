import { Hono } from "hono";
import { MetricsCollector } from "./metrics/collector.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger } from "./middleware/logger.js";
import { requestId } from "./middleware/request-id.js";
import { health } from "./routes/health.js";
import { createMetricsRoute } from "./routes/metrics.js";
import { ready } from "./routes/ready.js";
import { createWorkflowRoute } from "./routes/workflow.js";

export function createApp(): Hono {
	const app = new Hono();
	const collector = new MetricsCollector();

	// Middleware
	app.use("*", requestId);
	app.use("*", logger);
	app.onError(errorHandler);

	// Routes
	app.route("/", health);
	app.route("/", ready);
	app.route("/", createMetricsRoute(collector));
	app.route("/", createWorkflowRoute(collector));

	return app;
}
