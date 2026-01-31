import { Effect } from "effect";
import type { AnyData } from "@nvisy/core";
import type { ActionFn } from "../registry/action.js";

export const filter: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: evaluate predicate expression from config
		const _predicate = config["predicate"];
		return items;
	});
