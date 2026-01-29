import { NvisyError } from "./base.js";

export class ValidationError extends NvisyError {
	readonly code = "VALIDATION_ERROR";
	readonly field?: string;
	constructor(message: string, field?: string) {
		super(field ? `Validation error on '${field}': ${message}` : message);
		this.field = field;
	}
}
