import { RuntimeError } from "./runtime.js";

/** The operation was explicitly cancelled. */
export class CancellationError extends RuntimeError {}
