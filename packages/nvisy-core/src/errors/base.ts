/**
 * Base error class for all Nvisy errors.
 * All error subclasses extend this to enable discriminated error handling.
 */
export abstract class NvisyError extends Error {
	abstract readonly code: string;
	override readonly cause?: Error;

	constructor(message: string, cause?: Error) {
		super(message);
		this.name = this.constructor.name;
		this.cause = cause;
	}
}
