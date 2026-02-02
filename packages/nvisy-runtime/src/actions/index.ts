import { Module } from "@nvisy/core";
import { batch } from "./batch.js";
import { convert } from "./convert.js";
import { deduplicate } from "./deduplicate.js";
import { filter } from "./filter.js";
import { map } from "./map.js";
import { validate } from "./validate.js";

export { batch } from "./batch.js";
export { convert } from "./convert.js";
export { deduplicate } from "./deduplicate.js";
export { filter } from "./filter.js";
export { map } from "./map.js";
export { validate } from "./validate.js";

export const builtinModule = Module.define("builtin").withActions(
	filter,
	map,
	batch,
	deduplicate,
	validate,
	convert,
);
