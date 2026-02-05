import { createRoute } from "@hono/zod-openapi";
import { HealthResponseSchema, ReadyResponseSchema } from "./health-schema.js";

export const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	summary: "Liveness probe",
	responses: {
		200: {
			description: "Server is alive",
			content: { "application/json": { schema: HealthResponseSchema } },
		},
	},
});

export const readyRoute = createRoute({
	method: "get",
	path: "/ready",
	tags: ["Health"],
	summary: "Readiness probe",
	responses: {
		200: {
			description: "Server can accept work",
			content: { "application/json": { schema: ReadyResponseSchema } },
		},
		503: {
			description: "Server is not ready",
			content: { "application/json": { schema: ReadyResponseSchema } },
		},
	},
});
