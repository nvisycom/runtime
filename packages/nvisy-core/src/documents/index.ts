/**
 * @module documents
 *
 * Element ontology, coordinate types, and element class
 * for structured document representations.
 *
 * @example
 * ```ts
 * import {
 *   CoordinateSystem,
 *   ElementType,
 *   TextType,
 *   categoryOf,
 * } from "@nvisy/core";
 *
 * // Use the const object for type-safe element type checks
 * if (el.type === ElementType.Title) { … }
 *
 * // Look up which category an element belongs to
 * categoryOf("title"); // => "text"
 *
 * // Convert coordinates between pixel and point space
 * const px = CoordinateSystem.pixel(1920, 1080);
 * const pt = CoordinateSystem.point(612, 792);
 * const result = px.convertTo(pt, { x: 960, y: 540 });
 * ```
 */

export type {
	ElementCoordinates,
	Orientation,
	Point,
} from "./coordinates.js";
export { CoordinateSystem, Orientations } from "./coordinates.js";
export type {
	CompositeElementOptions,
	ElementOptions,
	ElementProvenance,
	EmailElementOptions,
	EmphasizedText,
	FormElementOptions,
	FormKeyValuePair,
	ImageElementOptions,
	Link,
	TableCellData,
	TableElementOptions,
} from "./elements.js";
export {
	CompositeElement,
	Element,
	EmailElement,
	FormElement,
	ImageElement,
	TableElement,
} from "./elements.js";
export type { ElementCategory } from "./ontology.js";
export {
	CodeType,
	categoryOf,
	ElementType,
	EmailType,
	FormType,
	LayoutType,
	MathType,
	MediaType,
	ontology,
	TableType,
	TextType,
} from "./ontology.js";
