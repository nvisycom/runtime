/**
 * @module @nvisy/plugin-markup
 *
 * Markup and text format parsing plugin for the Nvisy runtime.
 *
 * Provides actions for parsing and extracting structured data from
 * HTML, XML, JSON, CSV, TSV, and plain text formats.
 */

import { Plugin } from "@nvisy/core";

/** Markup parsing plugin instance. */
export const markupPlugin = Plugin.define("markup");
