import { Schema as S } from "effect";

export const ExecuteRequest = S.standardSchemaV1(
	S.Struct({
		graph: S.Record({ key: S.String, value: S.Unknown }),
		config: S.optional(S.Record({ key: S.String, value: S.Unknown })),
	}),
);

export const ValidateRequest = S.standardSchemaV1(
	S.Struct({
		graph: S.Record({ key: S.String, value: S.Unknown }),
	}),
);

export const RunIdParam = S.standardSchemaV1(
	S.Struct({ runId: S.String }),
);
