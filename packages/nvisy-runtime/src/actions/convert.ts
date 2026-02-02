import { z } from "zod";
import { Action, Data } from "@nvisy/core";

const ConvertParams = z.object({
	to: z.enum(["document", "embedding", "blob", "row"]),
});

export const convert = Action.withoutClient("convert", {
	types: [Data],
	params: ConvertParams,
	transform: (stream, _params) => {
		// TODO: cast between data types (Row -> Document, etc.)
		return stream;
	},
});
