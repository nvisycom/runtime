import { Effect } from "effect";
import type { AnyData } from "@nvisy/core";
import type { ActionFn } from "../registry/action.js";

export const batch: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: group items into batches of size N
		const _size = config["size"] ?? 100;
		return items;
	});
