/**
 * Structured error hierarchy for the Nvisy runtime.
 *
 * All errors extend {@link RuntimeError} which provides:
 * - `source` — component that raised the error
 * - `details` — machine-readable context
 * - `retryable` — whether the operation can be retried
 *
 * Default retryability:
 * - {@link RuntimeError} — `true` (transient failures)
 * - {@link ValidationError} — `false` (bad input won't fix itself)
 * - {@link ConnectionError} — `true` (network issues are transient)
 * - {@link TimeoutError} — `true` (timeouts are transient)
 * - {@link CancellationError} — `false` (intentional cancellation)
 *
 * @module
 */

export { CancellationError } from "./cancellation.js";
export { ConnectionError } from "./connection.js";
export type { ErrorContext, RuntimeErrorOptions } from "./runtime.js";
export { RuntimeError } from "./runtime.js";
export { TimeoutError } from "./timeout.js";
export { ValidationError } from "./validation.js";
