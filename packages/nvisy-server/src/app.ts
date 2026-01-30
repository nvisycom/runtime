import { Hono } from "hono";
import { graphRoutes } from "./routes/graphs.js";
import { runRoutes } from "./routes/runs.js";
import { connectorRoutes } from "./routes/connectors.js";
import { lineageRoutes } from "./routes/lineage.js";
import { healthRoutes } from "./routes/health.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/logger.js";

export function createApp(): Hono {
	const app = new Hono();

	// ── Middleware ──────────────────────────────────────────────────
	app.use("*", requestId());
	app.use("*", requestLogger());

	// ── Health ─────────────────────────────────────────────────────
	app.route("/", healthRoutes());

	// ── API ────────────────────────────────────────────────────────
	app.route("/api", graphRoutes());
	app.route("/api", runRoutes());
	app.route("/api", connectorRoutes());
	app.route("/api", lineageRoutes());

	return app;
}
