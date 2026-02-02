import { z } from "zod";
import { Action, Data } from "@nvisy/core";

const FilterParams = z.object({
	predicate: z.string(),
});

export const filter = Action.withoutClient("filter", {
	types: [Data],
	params: FilterParams,
	transform: (stream, _params) => {
		// TODO: evaluate predicate expression from params
		return stream;
	},
});
