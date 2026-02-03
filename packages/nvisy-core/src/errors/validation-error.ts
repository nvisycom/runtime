import { RuntimeError } from "./runtime-error.js";

/**
 * Input did not pass schema or business rules.
 *
 * Also covers invalid workflow and pipeline definitions.
 */
export class ValidationError extends RuntimeError {}
