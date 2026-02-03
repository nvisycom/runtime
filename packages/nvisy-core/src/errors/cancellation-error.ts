import { RuntimeError } from "./runtime-error.js";

/** The operation was explicitly cancelled. */
export class CancellationError extends RuntimeError {}
