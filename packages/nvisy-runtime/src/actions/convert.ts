import { Effect } from "effect";
import type { AnyData } from "@nvisy/core";
import type { ActionFn } from "../registry/action.js";

export const convert: ActionFn = (items, config) =>
	Effect.sync(() => {
		// TODO: cast between primitive types (Row → Document, etc.)
		const _targetType = config["to"];
		return items;
	});
