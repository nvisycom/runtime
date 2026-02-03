import { defineConfig } from "vitest/config";

/* Resolve the "source" export condition so workspace packages point to
   ./src/index.ts instead of ./dist/index.js. Vitest runs in Vite's SSR
   environment, so ssr.resolve.conditions is required here — the top-level
   resolve.conditions only applies to the client environment. */

export default defineConfig({
	/* Module Resolution */
	ssr: {
		resolve: {
			conditions: ["source", "import", "default"],
		},
	},

	test: {
		/* Environment */
		globals: true,
		environment: "node",

		/* Discovery */
		include: [
			"packages/*/src/**/*.{test,spec}.ts",
			"packages/*/test/**/*.{test,spec}.ts",
		],
		exclude: ["node_modules", "dist", "**/*.d.ts"],

		/* Coverage */
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

		/* Timeouts */
		testTimeout: 15000,
	},

	/* Transform */
	esbuild: { target: "es2024" },
});
