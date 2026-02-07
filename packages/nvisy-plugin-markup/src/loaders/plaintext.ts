import { Document, Loader } from "@nvisy/core";
import { z } from "zod";

/** Schema for plaintext loader parameters. */
export const plaintextParamsSchema = z
	.object({
		/** Character encoding of the blob data. Defaults to "utf-8". */
		encoding: z
			.enum(["utf-8", "ascii", "latin1", "utf16le"])
			.optional()
			.default("utf-8"),
	})
	.strict();

export type PlaintextParams = z.infer<typeof plaintextParamsSchema>;

/**
 * Loader that converts plaintext blobs (.txt files) into Documents.
 *
 * Reads the blob data as text using the specified encoding and
 * creates a Document with the text content.
 */
export const plaintextLoader = Loader.define<PlaintextParams>("plaintext", {
	extensions: [".txt"],
	contentTypes: ["text/plain"],
	params: plaintextParamsSchema,
	async *load(blob, params) {
		const content = blob.data.toString(params.encoding);
		const doc = new Document(content, { sourceType: "text" });
		doc.deriveFrom(blob);
		yield doc;
	},
});
