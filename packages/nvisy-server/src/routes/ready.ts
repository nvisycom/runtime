import { Hono } from "hono";

const ready = new Hono();

ready.get("/ready", (c) => {
	return c.json({
		status: "ready",
		checks: {
			memory: process.memoryUsage().heapUsed < 512 * 1024 * 1024,
		},
	});
});

export { ready };
