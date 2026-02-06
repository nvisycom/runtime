/**
 * Loader bridge for automatic Blob → Document conversion.
 *
 * When a source node produces Blobs but downstream nodes expect Documents,
 * this bridge automatically detects and applies the appropriate loader.
 * Converted documents are cached by blob ID to avoid duplicate conversions
 * when a source has multiple downstream consumers.
 */

import { getLogger } from "@logtape/logtape";
import { type Data, type Document, RuntimeError } from "@nvisy/core";
import { Blob } from "@nvisy/core";
import type { Registry } from "../registry.js";

const logger = getLogger(["nvisy", "bridge"]);

/** Cache for converted documents, shared across an execution run. */
export type LoaderCache = Map<string, Document[]>;

/** Creates a new empty loader cache for an execution run. */
export function createLoaderCache(): LoaderCache {
	return new Map();
}

/**
 * Wraps an async iterable to automatically convert Blobs to Documents.
 *
 * The bridge inspects each data item:
 * - If it's a Blob, looks up the appropriate loader and converts it
 * - If it's already a Document (or other type), passes it through unchanged
 *
 * Converted documents are cached by blob.id using the shared cache
 * to avoid redundant conversions when the same blob is consumed
 * by multiple downstream nodes.
 */
export interface BridgeOptions {
	/** When true, skip blobs with no matching loader instead of throwing. */
	readonly ignoreUnsupported?: boolean;
}

export async function* applyLoaderBridge(
	stream: AsyncIterable<Data>,
	registry: Registry,
	cache: LoaderCache,
	options?: BridgeOptions,
): AsyncIterable<Data> {
	for await (const item of stream) {
		if (!(item instanceof Blob)) {
			yield item;
			continue;
		}

		const cached = cache.get(item.id);
		if (cached) {
			logger.debug("Using cached documents for blob {id}", { id: item.id });
			for (const doc of cached) {
				yield doc;
			}
			continue;
		}

		const loader = registry.findLoaderForBlob({
			path: item.path,
			data: item.data,
			...(item.contentType && { contentType: item.contentType }),
		});

		if (!loader) {
			if (options?.ignoreUnsupported) {
				logger.warn("No loader found for blob {path}, skipping", {
					path: item.path,
				});
				continue;
			}
			throw new RuntimeError(
				`No loader found for blob: ${item.path} (contentType: ${item.contentType ?? "unknown"})`,
				{ source: "bridge", retryable: false },
			);
		}

		logger.debug("Converting blob {path} using loader {loader}", {
			path: item.path,
			loader: loader.id,
		});

		const docs: Document[] = [];
		const params = loader.schema.parse({});
		for await (const doc of loader.load(item, params)) {
			docs.push(doc);
			yield doc;
		}
		cache.set(item.id, docs);
	}
}
