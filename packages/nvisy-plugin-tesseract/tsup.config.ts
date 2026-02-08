import { defineConfig } from "tsup";

export default defineConfig({
	/* Entry */
	entry: ["src/index.ts"],
	format: ["esm"],

	/* Output */
	outDir: "dist",
	dts: { compilerOptions: { composite: false } },
	sourcemap: true,
	clean: true,

	/* Optimization */
	splitting: false,
	treeshake: true,
	skipNodeModulesBundle: true,

	/* Environment */
	platform: "node",
	target: "es2024",
});
