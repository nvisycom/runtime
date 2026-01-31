import { Hono } from "hono";
import { Schema as S } from "effect";
import { describeRoute, resolver } from "hono-openapi";

const HealthResponse = S.standardSchemaV1(
	S.Struct({ status: S.Literal("ok") }),
);

const ReadyResponse = S.standardSchemaV1(
	S.Struct({ status: S.Literal("ready", "unavailable") }),
);

const healthRoute = describeRoute({
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

const readyRoute = describeRoute({
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

/**
 * Health and readiness endpoints.
 *
 * GET /health — Liveness probe. Always returns 200.
 * GET /ready  — Readiness probe. Returns 200 when the runtime can accept work.
 */
export function healthRoutes(): Hono {
	const app = new Hono();

	app.get("/health", healthRoute, (c) => c.json({ status: "ok" as const }));

	app.get("/ready", readyRoute, (c) => {
		// TODO: check whether the runtime can accept new graph executions
		return c.json({ status: "ready" as const });
	});

	return app;
}
