import { readFile } from "node:fs/promises";

/** Load and parse a JSON file from disk. */
export async function loadJsonFile<T>(path: string): Promise<T> {
	const content = await readFile(path, "utf-8");
	return JSON.parse(content) as T;
}
