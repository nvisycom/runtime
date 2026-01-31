import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: [
			"packages/*/src/**/*.{test,spec}.ts",
			"packages/*/test/**/*.{test,spec}.ts",
			"packages/*/tests/**/*.{test,spec}.ts",
		],
		exclude: ["node_modules", "dist", "**/*.d.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"dist/",
				"coverage/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/index.ts",
			],
		},
		testTimeout: 15000,
	},
	esbuild: { target: "es2024" },
});
