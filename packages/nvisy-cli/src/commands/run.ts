import { loadJsonFile } from "../utils/file-loader.js";
import { error, info, success } from "../utils/output.js";

interface RunOptions {
	connections?: string;
}

/** Execute a workflow definition. */
export async function runCommand(
	workflowPath: string,
	options: RunOptions,
): Promise<void> {
	try {
		info(`Loading workflow from ${workflowPath}`);
		const _workflow = await loadJsonFile(workflowPath);

		let _connections: unknown = {};
		if (options.connections) {
			info(`Loading connections from ${options.connections}`);
			_connections = await loadJsonFile(options.connections);
		}

		// TODO: wire up Engine once @nvisy/graph is fully integrated
		info("Executing workflow...");
		error("Execution not yet implemented");
		process.exitCode = 1;
	} catch (err) {
		error(
			`Failed to run workflow: ${err instanceof Error ? err.message : String(err)}`,
		);
		process.exitCode = 1;
	}
}
