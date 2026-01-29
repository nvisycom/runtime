import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

export { createApp } from "./app.js";
export { formatPrometheus, MetricsCollector } from "./metrics/index.js";

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
	console.log(`nvisy server listening on http://localhost:${info.port}`);
});
