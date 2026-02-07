/**
 * Loaders that transform {@link Blob | Blobs} into {@link Document | Documents}.
 *
 * Each loader declares the file extensions and MIME types it handles,
 * so the engine can automatically select the right loader for a given
 * blob. Use {@link Loader.define} to create new loaders.
 *
 * @module
 */

import type { z } from "zod";
import type { Blob } from "./datatypes/blob.js";
import type { Document } from "./datatypes/document.js";

/**
 * Function that transforms a Blob into one or more Documents.
 *
 * @template TParam - Configuration parameters for the loader.
 */
export type LoadFn<TParam> = (
	blob: Blob,
	params: TParam,
) => AsyncIterable<Document>;

/**
 * Configuration for creating a loader.
 *
 * @template TParam - Configuration parameters for the loader.
 */
export interface LoaderConfig<TParam> {
	/** File extensions this loader handles (e.g. [".pdf"], [".md", ".markdown"]). */
	readonly extensions: string[];
	/** MIME types this loader handles (e.g. ["application/pdf"], ["text/plain"]). */
	readonly contentTypes: string[];
	/** Zod schema for validating loader parameters. */
	readonly params: z.ZodType<TParam>;
	/** The load function that transforms a Blob into Documents. */
	readonly load: LoadFn<TParam>;
}

/**
 * A registered loader instance that transforms Blobs into Documents.
 *
 * Loaders are specialized transforms that convert binary objects
 * (files from object storage) into structured Document instances
 * that can be processed by the pipeline.
 *
 * @template TParam - Configuration parameters for the loader.
 */
export interface LoaderInstance<TParam = unknown> {
	/** Unique identifier for this loader (e.g. "pdf", "docx"). */
	readonly id: string;
	/** File extensions this loader handles. */
	readonly extensions: readonly string[];
	/** MIME types this loader handles. */
	readonly contentTypes: readonly string[];
	/** Zod schema for validating loader parameters. */
	readonly schema: z.ZodType<TParam>;
	/** Transform a Blob into one or more Documents. */
	load(blob: Blob, params: TParam): AsyncIterable<Document>;
}

class LoaderImpl<TParam> implements LoaderInstance<TParam> {
	readonly id: string;
	readonly extensions: readonly string[];
	readonly contentTypes: readonly string[];
	readonly schema: z.ZodType<TParam>;
	readonly #load: LoadFn<TParam>;

	constructor(config: {
		id: string;
		extensions: string[];
		contentTypes: string[];
		schema: z.ZodType<TParam>;
		load: LoadFn<TParam>;
	}) {
		this.id = config.id;
		this.extensions = config.extensions;
		this.contentTypes = config.contentTypes;
		this.schema = config.schema;
		this.#load = config.load;
	}

	load(blob: Blob, params: TParam): AsyncIterable<Document> {
		return this.#load(blob, params);
	}
}

/** Factory for creating loader instances. */
export const Loader = {
	/**
	 * Create a loader that transforms Blobs into Documents.
	 *
	 * @param id - Unique identifier for the loader (e.g. "pdf", "docx").
	 * @param config - Loader configuration including match criteria and load function.
	 */
	define<TParam>(
		id: string,
		config: LoaderConfig<TParam>,
	): LoaderInstance<TParam> {
		return new LoaderImpl({
			id,
			extensions: config.extensions,
			contentTypes: config.contentTypes,
			schema: config.params,
			load: config.load,
		});
	},
} as const;
