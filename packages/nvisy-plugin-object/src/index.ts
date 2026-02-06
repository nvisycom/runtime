/**
 * @module @nvisy/plugin-object
 *
 * Object store plugin for the Nvisy runtime.
 *
 * Exposes S3, GCS, and Azure Blob providers, plus read/write streams
 * that list, get, and put objects as {@link Blob}s.
 *
 * @example
 * ```ts
 * import { objectPlugin } from "@nvisy/plugin-object";
 *
 * // Register with the runtime
 * runtime.register(objectPlugin);
 * ```
 */

import { Plugin } from "@nvisy/core";
import { azure, gcs, s3 } from "./providers/index.js";
import { read, write } from "./streams/index.js";

/** The Object plugin: register this with the runtime to enable object store providers and streams. */
export const objectPlugin = Plugin.define("object")
	.withProviders(s3, gcs, azure)
	.withStreams(read, write);

export { ObjectStoreClient } from "./providers/index.js";
export type { ListResult } from "./providers/index.js";
