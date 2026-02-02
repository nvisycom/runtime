import { z } from "zod";
import { Action, Data } from "@nvisy/core";

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
