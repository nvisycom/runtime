import { Action, Data } from "@nvisy/core";
import { z } from "zod";

const BatchParams = z.object({
	size: z.number().optional(),
});

export const batch = Action.withoutClient("batch", {
	types: [Data],
	params: BatchParams,
	transform: (stream, _params) => {
		// TODO: batching semantics belong at the runner/sink layer (e.g. Stream.grouped(n))
		return stream;
	},
});
