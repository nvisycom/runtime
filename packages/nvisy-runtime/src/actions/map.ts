import { Action, Data } from "@nvisy/core";
import { z } from "zod";

const MapParams = z.object({
	mapping: z.record(z.string(), z.string()),
});

export const map = Action.withoutClient("map", {
	types: [Data],
	params: MapParams,
	transform: (stream, _params) => {
		// TODO: apply field transformations from params
		return stream;
	},
});
