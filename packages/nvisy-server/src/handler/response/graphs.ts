import { z } from "zod";

export const ExecuteResponse = z.object({ runId: z.string() });

export const ValidateResponse = z.object({
	valid: z.boolean(),
	errors: z.array(z.string()),
});

export const RunStatusSchema = z.object({
	runId: z.string(),
	status: z.enum([
		"running",
		"success",
		"partial_failure",
		"failure",
		"cancelled",
	]),
	startedAt: z.string(),
	nodesCompleted: z.number(),
	nodesTotal: z.number(),
});

export const RunStatus = RunStatusSchema;

export const RunDetail = z.object({
	runId: z.string(),
	status: z.enum([
		"running",
		"success",
		"partial_failure",
		"failure",
		"cancelled",
	]),
	startedAt: z.string(),
	nodes: z.array(
		z.object({
			id: z.string(),
			status: z.enum(["pending", "running", "success", "failure", "skipped"]),
		}),
	),
});

export const RunListResponse = z.array(RunStatusSchema);

export const CancelResponse = z.object({
	cancelled: z.boolean(),
	runId: z.string(),
});
