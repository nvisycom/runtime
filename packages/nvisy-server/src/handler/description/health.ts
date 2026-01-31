import { describeRoute, resolver } from "hono-openapi";
import { HealthResponse, ReadyResponse } from "../response/index.js";

export const healthRoute = describeRoute({
	tags: ["Health"],
	summary: "Liveness probe",
	responses: {
		200: {
			description: "Server is alive",
			content: {
				"application/json": { schema: resolver(HealthResponse) },
			},
		},
	},
});

export const readyRoute = describeRoute({
	tags: ["Health"],
	summary: "Readiness probe",
	responses: {
		200: {
			description: "Server can accept work",
			content: {
				"application/json": { schema: resolver(ReadyResponse) },
			},
		},
		503: {
			description: "Server is not ready",
			content: {
				"application/json": { schema: resolver(ReadyResponse) },
			},
		},
	},
});
