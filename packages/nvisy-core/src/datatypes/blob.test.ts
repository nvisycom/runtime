import { describe, expect, it } from "vitest";
import { Blob } from "./blob.js";

describe("Blob", () => {
	it("stores path and data", () => {
		const data = Buffer.from("hello world");
		const blob = new Blob("uploads/file.txt", data);
		expect(blob.path).toBe("uploads/file.txt");
		expect(blob.data).toBe(data);
		expect(blob.data.toString()).toBe("hello world");
	});

	it("contentType is optional and defaults to undefined", () => {
		const blob = new Blob("file.bin", Buffer.from([0x00, 0x01]));
		expect(blob.contentType).toBeUndefined();
	});

	it("accepts contentType in constructor", () => {
		const blob = new Blob(
			"report.pdf",
			Buffer.from("pdf content"),
			"application/pdf",
		);
		expect(blob.contentType).toBe("application/pdf");
	});

	it("size returns byte length of data", () => {
		const blob = new Blob("file.txt", Buffer.from("abc"));
		expect(blob.size).toBe(3);
	});

	it("size handles empty buffer", () => {
		const blob = new Blob("empty.bin", Buffer.alloc(0));
		expect(blob.size).toBe(0);
	});

	it("size handles binary data correctly", () => {
		const binaryData = Buffer.from([0x00, 0xff, 0x10, 0x20, 0x30]);
		const blob = new Blob("binary.bin", binaryData);
		expect(blob.size).toBe(5);
	});

	it("extends Data and has id, parentId, metadata", () => {
		const blob = new Blob("file.txt", Buffer.from("content"));
		expect(blob.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(blob.parentId).toBeNull();
		expect(blob.metadata).toBeNull();
	});

	it("supports deriveFrom for lineage", () => {
		const parent = new Blob("parent.txt", Buffer.from("parent"));
		const child = new Blob("child.txt", Buffer.from("child")).deriveFrom(
			parent,
		);
		expect(child.parentId).toBe(parent.id);
		expect(child.isDerived).toBe(true);
	});

	it("supports withMetadata", () => {
		const blob = new Blob("file.txt", Buffer.from("content")).withMetadata({
			source: "s3",
			bucket: "my-bucket",
		});
		expect(blob.metadata).toEqual({ source: "s3", bucket: "my-bucket" });
	});

	it("handles various path formats", () => {
		const s3Blob = new Blob("s3://bucket/key/file.pdf", Buffer.from(""));
		expect(s3Blob.path).toBe("s3://bucket/key/file.pdf");

		const gcsBlob = new Blob("gs://bucket/object", Buffer.from(""));
		expect(gcsBlob.path).toBe("gs://bucket/object");

		const localBlob = new Blob("/var/data/file.txt", Buffer.from(""));
		expect(localBlob.path).toBe("/var/data/file.txt");
	});
});
