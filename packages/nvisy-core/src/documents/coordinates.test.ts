import { describe, expect, it } from "vitest";
import { CoordinateSystem, Orientations } from "./coordinates.js";

describe("Orientations", () => {
	it("SCREEN is [1, -1]", () => {
		expect(Orientations.SCREEN).toEqual([1, -1]);
	});

	it("CARTESIAN is [1, 1]", () => {
		expect(Orientations.CARTESIAN).toEqual([1, 1]);
	});
});

describe("CoordinateSystem", () => {
	describe("static factories", () => {
		it("pixel() creates a screen-oriented system", () => {
			const sys = CoordinateSystem.pixel(1920, 1080);
			expect(sys.width).toBe(1920);
			expect(sys.height).toBe(1080);
			expect(sys.orientation).toEqual(Orientations.SCREEN);
		});

		it("point() creates a cartesian-oriented system", () => {
			const sys = CoordinateSystem.point(612, 792);
			expect(sys.width).toBe(612);
			expect(sys.height).toBe(792);
			expect(sys.orientation).toEqual(Orientations.CARTESIAN);
		});

		it("relative() creates a 1x1 cartesian system", () => {
			const sys = CoordinateSystem.relative();
			expect(sys.width).toBe(1);
			expect(sys.height).toBe(1);
			expect(sys.orientation).toEqual(Orientations.CARTESIAN);
		});
	});

	describe("toRelative / fromRelative", () => {
		it("pixel origin (0,0) maps to relative (0,1)", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const rel = px.toRelative({ x: 0, y: 0 });
			expect(rel.x).toBeCloseTo(0);
			expect(rel.y).toBeCloseTo(1);
		});

		it("pixel bottom-right maps to relative (1,0)", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const rel = px.toRelative({ x: 100, y: 100 });
			expect(rel.x).toBeCloseTo(1);
			expect(rel.y).toBeCloseTo(0);
		});

		it("point origin (0,0) maps to relative (0,0)", () => {
			const pt = CoordinateSystem.point(612, 792);
			const rel = pt.toRelative({ x: 0, y: 0 });
			expect(rel.x).toBeCloseTo(0);
			expect(rel.y).toBeCloseTo(0);
		});

		it("fromRelative is the inverse of toRelative", () => {
			const px = CoordinateSystem.pixel(200, 300);
			const original = { x: 50, y: 75 };
			const rel = px.toRelative(original);
			const back = px.fromRelative(rel);
			expect(back.x).toBeCloseTo(original.x);
			expect(back.y).toBeCloseTo(original.y);
		});
	});

	describe("convertTo", () => {
		it("converts pixel top-left to point bottom-left", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const pt = CoordinateSystem.point(100, 100);
			const result = px.convertTo(pt, { x: 0, y: 0 });
			expect(result.x).toBeCloseTo(0);
			expect(result.y).toBeCloseTo(100);
		});

		it("converts pixel center to point center", () => {
			const px = CoordinateSystem.pixel(200, 200);
			const pt = CoordinateSystem.point(200, 200);
			const result = px.convertTo(pt, { x: 100, y: 100 });
			expect(result.x).toBeCloseTo(100);
			expect(result.y).toBeCloseTo(100);
		});

		it("handles different dimensions between systems", () => {
			const px = CoordinateSystem.pixel(1920, 1080);
			const pt = CoordinateSystem.point(612, 792);
			const result = px.convertTo(pt, { x: 960, y: 540 });
			expect(result.x).toBeCloseTo(306);
			expect(result.y).toBeCloseTo(396);
		});

		it("round-trips through relative", () => {
			const a = CoordinateSystem.pixel(800, 600);
			const b = CoordinateSystem.point(400, 300);
			const p = { x: 200, y: 150 };
			const converted = a.convertTo(b, p);
			const back = b.convertTo(a, converted);
			expect(back.x).toBeCloseTo(p.x);
			expect(back.y).toBeCloseTo(p.y);
		});
	});

	describe("convertAllTo", () => {
		it("converts all corner points at once", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const pt = CoordinateSystem.point(100, 100);
			const corners = [
				{ x: 10, y: 20 },
				{ x: 10, y: 80 },
				{ x: 90, y: 80 },
				{ x: 90, y: 20 },
			];
			const result = px.convertAllTo(pt, corners);
			expect(result).toHaveLength(4);
			expect(result[0]!.x).toBeCloseTo(10);
			expect(result[0]!.y).toBeCloseTo(80);
		});

		it("returns empty array for empty input", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const pt = CoordinateSystem.point(100, 100);
			expect(px.convertAllTo(pt, [])).toEqual([]);
		});
	});

	describe("equals", () => {
		it("returns true for identical systems", () => {
			const a = CoordinateSystem.pixel(100, 200);
			const b = CoordinateSystem.pixel(100, 200);
			expect(a.equals(b)).toBe(true);
		});

		it("returns false for different orientations", () => {
			const px = CoordinateSystem.pixel(100, 100);
			const pt = CoordinateSystem.point(100, 100);
			expect(px.equals(pt)).toBe(false);
		});

		it("returns false for different dimensions", () => {
			const a = CoordinateSystem.pixel(100, 100);
			const b = CoordinateSystem.pixel(200, 100);
			expect(a.equals(b)).toBe(false);
		});
	});
});
