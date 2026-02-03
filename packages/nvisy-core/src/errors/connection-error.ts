import { RuntimeError } from "./runtime-error.js";

/**
 * Could not reach an external service, storage backend, or database.
 *
 * Also covers missing or unregistered connections.
 */
export class ConnectionError extends RuntimeError {}
