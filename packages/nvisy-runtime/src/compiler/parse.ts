import { Effect, Schema as S } from "effect";
import { GraphDefinition } from "../schema/index.js";

export const parseGraph = (
	input: unknown,
): Effect.Effect<GraphDefinition, Error> =>
	S.decodeUnknown(GraphDefinition)(input).pipe(
		Effect.mapError(
			(error) => new Error(`Graph parse error: ${String(error)}`),
		),
	);
