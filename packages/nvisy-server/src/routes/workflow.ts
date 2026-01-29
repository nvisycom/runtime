import { Hono } from "hono";
import type { MetricsCollector } from "../metrics/collector.js";
import type {
	WorkflowExecuteRequest,
	WorkflowExecuteResponse,
} from "../schema/workflow.js";

export function createWorkflowRoute(_collector: MetricsCollector): Hono {
	const workflow = new Hono();

	workflow.post("/workflow/execute", async (c) => {
		const body = await c.req.json<WorkflowExecuteRequest>();

		if (!body.workflow || !Array.isArray(body.workflow.nodes)) {
			return c.json(
				{ error: "VALIDATION_ERROR", message: "Invalid workflow definition" },
				422,
			);
		}

		// TODO: wire up Engine.execute() once graph package is integrated
		const response: WorkflowExecuteResponse = {
			status: "completed",
			itemsProcessed: 0,
			durationMs: 0,
		};

		return c.json(response);
	});

	return workflow;
}
