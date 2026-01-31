import { Schema as S } from "effect";

export const HealthResponse = S.standardSchemaV1(
	S.Struct({ status: S.Literal("ok") }),
);

export const ReadyResponse = S.standardSchemaV1(
	S.Struct({ status: S.Literal("ready", "unavailable") }),
);
