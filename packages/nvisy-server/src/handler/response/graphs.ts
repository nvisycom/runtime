import { Schema as S } from "effect";

export const ExecuteResponse = S.standardSchemaV1(
	S.Struct({ runId: S.String }),
);

export const ValidateResponse = S.standardSchemaV1(
	S.Struct({
		valid: S.Boolean,
		errors: S.Array(S.String),
	}),
);

export const RunStatusSchema = S.Struct({
	runId: S.String,
	status: S.Literal(
		"running",
		"success",
		"partial_failure",
		"failure",
		"cancelled",
	),
	startedAt: S.String,
	nodesCompleted: S.Number,
	nodesTotal: S.Number,
});

export const RunStatus = S.standardSchemaV1(RunStatusSchema);

export const RunDetail = S.standardSchemaV1(
	S.Struct({
		runId: S.String,
		status: S.Literal(
			"running",
			"success",
			"partial_failure",
			"failure",
			"cancelled",
		),
		startedAt: S.String,
		nodes: S.Array(
			S.Struct({
				id: S.String,
				status: S.Literal("pending", "running", "success", "failure", "skipped"),
			}),
		),
	}),
);

export const RunListResponse = S.standardSchemaV1(S.Array(RunStatusSchema));

export const ErrorResponse = S.standardSchemaV1(
	S.Struct({ error: S.String, runId: S.String }),
);

export const CancelResponse = S.standardSchemaV1(
	S.Struct({ cancelled: S.Boolean, runId: S.String }),
);
