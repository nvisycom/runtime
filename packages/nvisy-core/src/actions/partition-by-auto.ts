/**
 * Auto partition strategy.
 *
 * Passes document content through as-is, preserving structured
 * elements when present.
 *
 * @module
 */

import type { Document } from "../datatypes/index.js";

/** Auto-strategy parameters (no additional options). */
export type AutoStrategyParams = Record<string, never>;

/** Pass document content through unchanged. */
export function partitionByAuto(
	doc: Document,
	_params: AutoStrategyParams,
): string[] {
	return [doc.content];
}
