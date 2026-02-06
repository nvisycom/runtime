/**
 * @module @nvisy/runtime
 *
 * Pipeline execution engine for the Nvisy runtime.
 *
 * Compiles graph definitions into execution plans, validates connections,
 * and runs pipelines with retry, timeout, and cancellation support.
 */

export { Engine } from "./engine/index.js";
export type {
	ActionDescriptor,
	Connection,
	Connections,
	ExecuteOptions,
	NodeProgress,
	NodeResult,
	ProviderDescriptor,
	RegistrySchema,
	RunResult,
	RunState,
	RunStatus,
	RunSummary,
	ValidationResult,
} from "./engine/index.js";
export type {
	ActionNode,
	BackoffStrategy,
	ConcurrencyPolicy,
	Graph,
	GraphEdge,
	GraphNode,
	RetryPolicy,
	SourceNode,
	TargetNode,
	TimeoutPolicy,
} from "./schema.js";
