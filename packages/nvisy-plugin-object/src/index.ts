/**
 * @module @nvisy/plugin-object
 *
 * Object store plugin for the Nvisy runtime.
 *
 * Exposes object store providers (S3, GCS), file format readers/writers
 * (Parquet, JSONL, CSV), and related actions for the pipeline.
 */

import { Datatypes, Plugin } from "@nvisy/core";
import { Blob } from "./datatypes/index.js";

/** The Object plugin: register this with the runtime to enable object store providers and actions. */
export const objectPlugin = Plugin.define("object").withDatatypes(
	Datatypes.define("blob", Blob),
);

export { Blob } from "./datatypes/index.js";
