import type { ActionFn } from "../registry/action.js";
import { filter } from "./filter.js";
import { map } from "./map.js";
import { batch } from "./batch.js";
import { deduplicate } from "./deduplicate.js";
import { validate } from "./validate.js";
import { convert } from "./convert.js";

export { filter } from "./filter.js";
export { map } from "./map.js";
export { batch } from "./batch.js";
export { deduplicate } from "./deduplicate.js";
export { validate } from "./validate.js";
export { convert } from "./convert.js";

export const builtinActions: ReadonlyArray<[string, ActionFn]> = [
	["filter", filter],
	["map", map],
	["batch", batch],
	["deduplicate", deduplicate],
	["validate", validate],
	["convert", convert],
];
