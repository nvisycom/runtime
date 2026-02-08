/**
 * Rule-based partition strategy.
 *
 * Splits document content using a user-supplied regex pattern.
 * Optionally infers HTML table structure from structured
 * {@link TableElement} cells.
 *
 * @module
 */

import type { Document } from "@nvisy/core";
import { type Element, type TableCellData, TableElement } from "@nvisy/core";

/** Rule-strategy parameters. */
export interface RuleStrategyParams {
	/** Regex pattern to split content on. */
	readonly pattern: string;
	/** Whether to include the delimiter in chunks. */
	readonly includeDelimiter: boolean;
	/** Replace table element text with inferred HTML table markup. */
	readonly inferTableStructure: boolean;
}

/** Split document content using a regex pattern. */
export function partitionByRule(
	doc: Document,
	params: RuleStrategyParams,
): string[] {
	let content = doc.content;

	if (params.inferTableStructure && doc.elements != null) {
		content = applyTableStructure(content, doc.elements);
	}

	const regex = new RegExp(params.pattern, "g");
	return content.split(regex).filter((p) => p.length > 0);
}

/** Replace plain-text table representations with HTML tables built from cell data. */
function applyTableStructure(
	content: string,
	elements: readonly Element[],
): string {
	for (const el of elements) {
		if (
			!(el instanceof TableElement) ||
			el.cells == null ||
			el.cells.length === 0
		) {
			continue;
		}

		const html = cellsToHtml(el.cells);
		content = content.replace(el.text, html);
	}
	return content;
}

/** Build an HTML `<table>` string from structured cell data. */
function cellsToHtml(cells: readonly TableCellData[]): string {
	const rows = new Map<number, (typeof cells)[number][]>();
	for (const cell of cells) {
		let row = rows.get(cell.row);
		if (row == null) {
			row = [];
			rows.set(cell.row, row);
		}
		row.push(cell);
	}

	const lines: string[] = ["<table>"];
	for (const [, rowCells] of [...rows.entries()].sort(([a], [b]) => a - b)) {
		rowCells.sort((a, b) => a.column - b.column);
		const tag = rowCells[0]?.isHeader ? "th" : "td";
		const cellHtml = rowCells.map((c) => `<${tag}>${c.text}</${tag}>`).join("");
		lines.push(`<tr>${cellHtml}</tr>`);
	}
	lines.push("</table>");
	return lines.join("");
}
