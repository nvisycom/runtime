import { Effect } from "effect";
import type { ActionFn } from "../registry/action.js";

export const map: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: apply field transformations from config
		const _mapping = config["mapping"];
		return items;
	});
