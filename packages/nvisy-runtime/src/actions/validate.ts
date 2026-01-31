import { Effect } from "effect";
import type { ActionFn } from "../registry/action.js";

export const validate: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: assert primitives match a schema
		// TODO: route failures to DLQ
		const _schema = config["schema"];
		return items;
	});
