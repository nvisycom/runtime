import { Effect } from "effect";
import type { ActionFn } from "../registry/action.js";

export const deduplicate: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: drop duplicates by content hash or user-defined key
		const _key = config["key"] ?? "id";
		return items;
	});
