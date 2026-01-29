#!/usr/bin/env node

import { runCommand } from "./commands/run.js";
import { validateCommand } from "./commands/validate.js";
import { versionCommand } from "./commands/version.js";

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
	switch (command) {
		case "run": {
			const workflowPath = args[1];
			if (!workflowPath) {
				console.error(
					"Usage: nvisy run <workflow.json> [--connections <conn.json>]",
				);
				process.exitCode = 1;
				return;
			}
			const connectionsIdx = args.indexOf("--connections");
			const connections =
				connectionsIdx >= 0 ? args[connectionsIdx + 1] : undefined;
			await runCommand(workflowPath, { connections });
			break;
		}

		case "validate": {
			const workflowPath = args[1];
			if (!workflowPath) {
				console.error("Usage: nvisy validate <workflow.json>");
				process.exitCode = 1;
				return;
			}
			await validateCommand(workflowPath);
			break;
		}

		case "version":
		case "--version":
		case "-v":
			versionCommand();
			break;

		default:
			console.log("nvisy - ETL runtime for LLM pipelines\n");
			console.log("Commands:");
			console.log(
				"  run <workflow.json> [--connections <conn.json>]  Execute a workflow",
			);
			console.log(
				"  validate <workflow.json>                         Validate a workflow",
			);
			console.log(
				"  version                                          Show version",
			);
			break;
	}
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exitCode = 1;
});
