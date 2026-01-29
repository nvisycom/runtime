import type { NodeId } from "../types/node.js";
import { NvisyError } from "./base.js";

export class InvalidDefinitionError extends NvisyError {
	readonly code = "INVALID_DEFINITION";
	constructor(message: string) {
		super(`Invalid workflow definition: ${message}`);
	}
}

export class NodeFailedError extends NvisyError {
	readonly code = "NODE_FAILED";
	readonly nodeId: NodeId;
	constructor(nodeId: NodeId, message: string, cause?: Error) {
		super(`Node ${nodeId} failed: ${message}`, cause);
		this.nodeId = nodeId;
	}
}

export class TimeoutError extends NvisyError {
	readonly code = "TIMEOUT";
	constructor(message = "Workflow execution timed out") {
		super(message);
	}
}

export class CancelledError extends NvisyError {
	readonly code = "CANCELLED";
	constructor(message = "Workflow execution cancelled") {
		super(message);
	}
}
