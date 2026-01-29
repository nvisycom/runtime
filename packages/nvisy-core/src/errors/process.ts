import { NvisyError } from "./base.js";

export class ProcessError extends NvisyError {
	readonly code = "PROCESS_ERROR";
	readonly processorKind?: string;
	constructor(message: string, processorKind?: string, cause?: Error) {
		super(processorKind ? `[${processorKind}] ${message}` : message, cause);
		this.processorKind = processorKind;
	}
}
