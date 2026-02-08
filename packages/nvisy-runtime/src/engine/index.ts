/**
 * Engine module public API.
 *
 * Re-exports the {@link Engine} class and all supporting types that
 * consumers need for graph registration, validation, execution,
 * and run monitoring.
 *
 * @module
 */

export type {
	ActionDescriptor,
	ProviderDescriptor,
	RegistrySchema,
} from "../registry.js";
export type { Connection, Connections } from "./connections.js";
export { Engine, type ValidationResult } from "./engine.js";
export type { ExecuteOptions, RunResult } from "./executor.js";
export type { NodeResult } from "./nodes.js";
export type { NodeProgress, RunState, RunStatus, RunSummary } from "./runs.js";
