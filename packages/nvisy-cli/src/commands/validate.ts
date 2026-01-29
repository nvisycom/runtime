import { loadJsonFile } from "../utils/file-loader.js";
import { error, success } from "../utils/output.js";

/** Validate a workflow definition file. */
export async function validateCommand(workflowPath: string): Promise<void> {
	try {
		const definition = await loadJsonFile(workflowPath);

		if (
			!definition ||
			typeof definition !== "object" ||
			!("nodes" in definition) ||
			!("edges" in definition)
		) {
			error("Invalid workflow: must contain 'nodes' and 'edges' arrays");
			process.exitCode = 1;
			return;
		}

		// TODO: call validateWorkflow() from @nvisy/graph once integrated
		success(`Workflow at ${workflowPath} is valid`);
	} catch (err) {
		error(
			`Failed to validate: ${err instanceof Error ? err.message : String(err)}`,
		);
		process.exitCode = 1;
	}
}
