import { Action, Data } from "@nvisy/core";
import { z } from "zod";

const DeduplicateParams = z.object({
	key: z.string().optional(),
});

export const deduplicate = Action.withoutClient("deduplicate", {
	types: [Data],
	params: DeduplicateParams,
	transform: (stream, _params) => {
		// TODO: drop duplicates by _params.key ?? "id"
		return stream;
	},
});
