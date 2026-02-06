/**
 * @module @nvisy/plugin-pandoc
 *
 * Pandoc document conversion plugin for the Nvisy runtime.
 *
 * Provides actions for converting documents between formats using Pandoc.
 */

import { Plugin } from "@nvisy/core";

/** Pandoc plugin instance. */
export const pandocPlugin = Plugin.define("pandoc");
