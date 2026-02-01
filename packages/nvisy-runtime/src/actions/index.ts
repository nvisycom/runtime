import { Module } from "@nvisy/core";
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

export const builtinModule = Module.define("builtin")
	.withActions(filter, map, batch, deduplicate, validate, convert);
