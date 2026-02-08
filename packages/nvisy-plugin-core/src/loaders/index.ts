/**
 * @module loaders
 *
 * Built-in loaders for the core plugin.
 */

export type { CsvParams } from "./csv.js";
export { csvLoader, csvParamsSchema } from "./csv.js";
export type { JsonParams } from "./json.js";
export { jsonLoader, jsonParamsSchema } from "./json.js";
export type { PlaintextParams } from "./plaintext.js";
export { plaintextLoader, plaintextParamsSchema } from "./plaintext.js";
