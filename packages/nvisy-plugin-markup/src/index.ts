/**
 * @module @nvisy/plugin-markup
 *
 * Markup and text format parsing plugin for the Nvisy runtime.
 *
 * Provides actions for parsing and extracting structured data from
 * HTML, XML, JSON, CSV, TSV, and plain text formats.
 */

import { Plugin } from "@nvisy/core";
import { plaintextLoader } from "./loaders/index.js";

export type { PlaintextParams } from "./loaders/index.js";
export { plaintextLoader, plaintextParamsSchema } from "./loaders/index.js";

/** Markup parsing plugin instance. */
export const markupPlugin =
	Plugin.define("markup").withLoaders(plaintextLoader);
