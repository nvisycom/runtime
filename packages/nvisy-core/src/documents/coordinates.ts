/**
 * Spatial coordinate systems and element positioning for document elements.
 *
 * Coordinate systems differ by origin and axis direction:
 * - **Pixel space** — origin at top-left, y increases downward (images, OCR).
 * - **Point space** — origin at bottom-left, y increases upward (PDF, PostScript).
 * - **Relative**    — unit square (0–1 on both axes), y increases upward.
 *
 * Element positions are stored as an array of corner {@link Point | points}
 * rather than an axis-aligned bounding box, so rotated and skewed regions
 * are represented without loss.
 *
 * Use {@link CoordinateSystem.convertTo} to transform points between systems.
 *
 * @example
 * ```ts
 * const px = CoordinateSystem.pixel(1920, 1080);
 * const pt = CoordinateSystem.point(612, 792);
 * const result = px.convertTo(pt, { x: 960, y: 540 });
 * ```
 *
 * @module
 */

/** A point in 2D space. */
export interface Point {
	readonly x: number;
	readonly y: number;
}

/**
 * Axis orientation as an `[xSign, ySign]` tuple.
 *
 * - `1`  — value grows in the standard (rightward / upward) direction.
 * - `-1` — axis is inverted (e.g. y grows downward for screen coordinates).
 */
export type Orientation = readonly [x: 1 | -1, y: 1 | -1];

/**
 * Built-in orientation presets.
 *
 * - `Orientations.SCREEN`    — origin top-left, y increases downward.
 * - `Orientations.CARTESIAN` — origin bottom-left, y increases upward.
 */
export const Orientations = {
	/** Screen orientation — origin top-left, y increases downward. */
	SCREEN: [1, -1] as Orientation,
	/** Cartesian orientation — origin bottom-left, y increases upward. */
	CARTESIAN: [1, 1] as Orientation,
} as const;

/** Convert a single coordinate along one axis via a linear transformation. */
function convertAxis(
	value: number,
	fromMax: number,
	toMax: number,
	sign: 1 | -1,
): number {
	const t = value / fromMax;
	return (((1 - t) * (1 - sign)) / 2 + (t * (1 + sign)) / 2) * toMax;
}

/**
 * A finite coordinate plane with a given width, height, and orientation.
 *
 * Instances are immutable value objects. Use the static factories
 * {@link CoordinateSystem.pixel}, {@link CoordinateSystem.point}, and
 * {@link CoordinateSystem.relative} for the common coordinate spaces.
 */
export class CoordinateSystem {
	/** Width of the coordinate plane. */
	readonly width: number;

	/** Height of the coordinate plane. */
	readonly height: number;

	/** Axis orientation of this coordinate system. */
	readonly orientation: Orientation;

	constructor(width: number, height: number, orientation: Orientation) {
		this.width = width;
		this.height = height;
		this.orientation = orientation;
	}

	/** Pixel-space system (origin top-left, y down). */
	static pixel(width: number, height: number): CoordinateSystem {
		return new CoordinateSystem(width, height, Orientations.SCREEN);
	}

	/** Point-space system (origin bottom-left, y up). */
	static point(width: number, height: number): CoordinateSystem {
		return new CoordinateSystem(width, height, Orientations.CARTESIAN);
	}

	/** Unit-square relative coordinate system (0–1, Cartesian). */
	static relative(): CoordinateSystem {
		return new CoordinateSystem(1, 1, Orientations.CARTESIAN);
	}

	/** Convert a point from this system to the 0–1 relative system. */
	toRelative(p: Point): Point {
		const [xSign, ySign] = this.orientation;
		return {
			x: convertAxis(p.x, this.width, 1, xSign),
			y: convertAxis(p.y, this.height, 1, ySign),
		};
	}

	/** Convert a point from the 0–1 relative system into this system. */
	fromRelative(p: Point): Point {
		const [xSign, ySign] = this.orientation;
		return {
			x: convertAxis(p.x, 1, this.width, xSign),
			y: convertAxis(p.y, 1, this.height, ySign),
		};
	}

	/** Convert a point from this system into `target`. */
	convertTo(target: CoordinateSystem, p: Point): Point {
		return target.fromRelative(this.toRelative(p));
	}

	/**
	 * Convert an array of points from this system into `target`.
	 *
	 * Convenience wrapper around {@link convertTo} for transforming
	 * all corners of an {@link ElementCoordinates.points} array at once.
	 */
	convertAllTo(target: CoordinateSystem, points: readonly Point[]): Point[] {
		return points.map((p) => this.convertTo(target, p));
	}

	/** Structural equality. */
	equals(other: CoordinateSystem): boolean {
		return (
			this.width === other.width &&
			this.height === other.height &&
			this.orientation[0] === other.orientation[0] &&
			this.orientation[1] === other.orientation[1]
		);
	}
}

/**
 * Spatial coordinates for a document element.
 *
 * Corner points specify the bounding region of the element, starting
 * from the top-left corner and proceeding counter-clockwise. Using
 * points rather than an axis-aligned box naturally handles rotated
 * and skewed regions.
 *
 * @example
 * ```ts
 * const coords: ElementCoordinates = {
 *   points: [
 *     { x: 10, y: 20 },   // top-left
 *     { x: 10, y: 120 },  // bottom-left
 *     { x: 210, y: 120 }, // bottom-right
 *     { x: 210, y: 20 },  // top-right
 *   ],
 *   system: CoordinateSystem.pixel(1920, 1080),
 * };
 * ```
 */
export interface ElementCoordinates {
	/**
	 * Corner points of the bounding region, counter-clockwise
	 * from top-left.
	 */
	readonly points: readonly Point[];
	/** The coordinate system the points were measured in. */
	readonly system: CoordinateSystem;
}
