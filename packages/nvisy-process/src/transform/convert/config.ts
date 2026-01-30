export interface ConvertConfig {
	targetFormat: "markdown" | "html" | "json" | "csv" | "plaintext";
	extractImages?: boolean;
}
