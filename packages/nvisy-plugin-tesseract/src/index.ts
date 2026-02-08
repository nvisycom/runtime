/**
 * @module @nvisy/plugin-tesseract
 *
 * Optical character recognition plugin for the Nvisy runtime.
 *
 * Provides actions for extracting text from images and scanned
 * documents using Tesseract.
 */

import { Plugin } from "@nvisy/core";

/** Tesseract OCR plugin instance. */
export const tesseractPlugin = Plugin.define("tesseract");
