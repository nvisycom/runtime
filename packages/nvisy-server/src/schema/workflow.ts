import type { ConnectionSchema } from "./connection.js";

/** JSON schema shape for the POST /workflow/execute request body. */
export interface WorkflowExecuteRequest {
	workflow: {
		nodes: unknown[];
		edges: unknown[];
		metadata?: Record<string, unknown>;
	};
	connections: ConnectionSchema[];
}

/** Response shape for POST /workflow/execute. */
export interface WorkflowExecuteResponse {
	status: "completed" | "failed" | "cancelled";
	itemsProcessed: number;
	errors?: string[];
	durationMs: number;
}
