import { describe, expect, it } from "vitest";
import { Document, TableElement } from "../datatypes/index.js";
import { partitionByRule } from "./partition-by-rule.js";

describe("partitionByRule", () => {
	it("splits on a regex pattern", () => {
		const doc = new Document("one---two---three");
		const parts = partitionByRule(doc, {
			pattern: "---",
			includeDelimiter: false,
			inferTableStructure: false,
		});
		expect(parts).toEqual(["one", "two", "three"]);
	});

	describe("inferTableStructure", () => {
		it("replaces table text with HTML when enabled", () => {
			const table = new TableElement({
				type: "table",
				text: "Name Age\nAlice 30",
				cells: [
					{ row: 0, column: 0, text: "Name", isHeader: true },
					{ row: 0, column: 1, text: "Age", isHeader: true },
					{ row: 1, column: 0, text: "Alice" },
					{ row: 1, column: 1, text: "30" },
				],
			});

			const doc = new Document("Before\n---\nName Age\nAlice 30\n---\nAfter", {
				elements: [table],
			});

			const parts = partitionByRule(doc, {
				pattern: "\n---\n",
				includeDelimiter: false,
				inferTableStructure: true,
			});

			expect(parts).toHaveLength(3);
			expect(parts[0]).toBe("Before");
			expect(parts[1]).toContain("<table>");
			expect(parts[1]).toContain("<th>Name</th>");
			expect(parts[1]).toContain("<th>Age</th>");
			expect(parts[1]).toContain("<td>Alice</td>");
			expect(parts[1]).toContain("<td>30</td>");
			expect(parts[1]).toContain("</table>");
			expect(parts[2]).toBe("After");
		});

		it("does not modify content when disabled", () => {
			const table = new TableElement({
				type: "table",
				text: "Name Age",
				cells: [
					{ row: 0, column: 0, text: "Name", isHeader: true },
					{ row: 0, column: 1, text: "Age", isHeader: true },
				],
			});

			const doc = new Document("Name Age", { elements: [table] });

			const parts = partitionByRule(doc, {
				pattern: "---",
				includeDelimiter: false,
				inferTableStructure: false,
			});

			expect(parts).toEqual(["Name Age"]);
		});

		it("ignores elements without cells", () => {
			const table = new TableElement({
				type: "table",
				text: "some table",
			});

			const doc = new Document("some table", { elements: [table] });

			const parts = partitionByRule(doc, {
				pattern: "---",
				includeDelimiter: false,
				inferTableStructure: true,
			});

			expect(parts).toEqual(["some table"]);
		});

		it("sorts cells by row and column", () => {
			const table = new TableElement({
				type: "table",
				text: "data",
				cells: [
					{ row: 1, column: 1, text: "D" },
					{ row: 0, column: 1, text: "B", isHeader: true },
					{ row: 1, column: 0, text: "C" },
					{ row: 0, column: 0, text: "A", isHeader: true },
				],
			});

			const doc = new Document("data", { elements: [table] });

			const parts = partitionByRule(doc, {
				pattern: "---",
				includeDelimiter: false,
				inferTableStructure: true,
			});

			expect(parts[0]).toBe(
				"<table><tr><th>A</th><th>B</th></tr><tr><td>C</td><td>D</td></tr></table>",
			);
		});
	});
});
