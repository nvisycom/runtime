/**
 * Primary runtime entry point.
 *
 * Coordinates plugin registration, graph validation, and execution.
 * The Engine auto-loads {@link corePlugin} (Document, Blob, Chunk,
 * Embedding datatypes plus chunk/partition actions) at construction.
 * Additional plugins are registered via {@link Engine.register}.
 *
 * Delegates graph execution to the {@link execute executor} and run
 * tracking to the {@link RunManager}.
 *
 * @example
 * ```ts
 * const engine = new Engine()
 *   .register(sqlPlugin)
 *   .register(aiPlugin);
 *
 * // Background execution with run tracking
 * const runId = engine.execute(graph, connections);
 * const state = engine.getRun(runId);
 *
 * // Synchronous execution (blocks until completion)
 * const result = await engine.executeSync(graph, connections);
 * ```
 *
 * @module
 */

import type { PluginInstance } from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { corePlugin } from "@nvisy/plugin-core";
import { compile, type ExecutionPlan } from "../compiler/index.js";
import { Registry, type RegistrySchema } from "../registry.js";
import {
	type Connections,
	ConnectionsSchema,
	validateConnections,
} from "./connections.js";
import { type ExecuteOptions, execute, type RunResult } from "./executor.js";
import {
	RunManager,
	type RunState,
	type RunStatus,
	type RunSummary,
} from "./runs.js";

/**
 * Result of graph validation.
 *
 * Returned by {@link Engine.validate}. When `valid` is false, `errors`
 * contains human-readable descriptions of every issue found (graph
 * structure problems, missing connections, credential schema mismatches).
 */
export interface ValidationResult {
	/** Whether the graph and its connections passed all checks. */
	readonly valid: boolean;
	/** Validation error messages (empty when valid). */
	readonly errors: ReadonlyArray<string>;
}

/**
 * Central orchestrator for pipeline registration, validation, and execution.
 *
 * The constructor pre-loads {@link corePlugin} so the built-in datatypes
 * (Document, Blob, Chunk, Embedding) and actions (chunk, partition) are
 * always available. Call {@link register} to add provider and action
 * plugins before executing graphs.
 *
 * Execution modes:
 * - {@link execute} — fire-and-forget; returns a `runId` for polling via
 *   {@link getRun}, {@link listRuns}, and {@link cancelRun}.
 * - {@link executeSync} — awaitable; resolves with the full
 *   {@link RunResult} when the graph finishes.
 */
export class Engine {
	readonly #registry = new Registry();
	readonly #runs = new RunManager();

	/** Pre-loads {@link corePlugin} so built-in datatypes and actions are always available. */
	constructor() {
		this.#registry.load(corePlugin);
	}

	/** Snapshot of every registered action, provider, stream, loader, and datatype. */
	get schema(): RegistrySchema {
		return this.#registry.schema;
	}

	/**
	 * Register a plugin's providers, actions, streams, loaders, and datatypes.
	 *
	 * Plugins are registered under their `id`; duplicate IDs throw a
	 * {@link ValidationError}. Returns `this` to allow fluent chaining.
	 *
	 * @param plugin - Plugin instance produced by `Plugin.define(…)`.
	 */
	register(plugin: PluginInstance): this {
		this.#registry.load(plugin);
		return this;
	}

	/**
	 * Validate a graph definition and connections without executing.
	 *
	 * Performs three layers of validation:
	 * 1. **Connection shape** — each entry matches {@link ConnectionSchema}.
	 * 2. **Graph structure** — JSON parsing, cycle detection, dangling
	 *    edges, and name resolution against the registry.
	 * 3. **Credential validation** — each connection's credentials are
	 *    checked against the provider's Zod schema.
	 *
	 * All errors are collected; the method never throws.
	 */
	validate(graph: unknown, connections: Connections): ValidationResult {
		const errors: string[] = [];

		const shapeResult = ConnectionsSchema.safeParse(connections);
		if (!shapeResult.success) {
			errors.push(...shapeResult.error.issues.map((i) => i.message));
		}

		let plan: ExecutionPlan | null = null;
		try {
			plan = compile(graph, this.#registry);
		} catch (e) {
			errors.push(e instanceof Error ? e.message : String(e));
		}

		if (plan) {
			try {
				validateConnections(plan, connections);
			} catch (e) {
				// biome-ignore lint/complexity/useLiteralKeys: index signature requires bracket access
				if (e instanceof ValidationError && e.details?.["errors"]) {
					// biome-ignore lint/complexity/useLiteralKeys: index signature requires bracket access
					errors.push(...(e.details["errors"] as string[]));
				} else {
					errors.push(e instanceof Error ? e.message : String(e));
				}
			}
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Execute a graph in the background.
	 *
	 * Compiles and validates the graph, then hands it to the
	 * {@link RunManager} for asynchronous execution. Returns
	 * immediately with a `runId` for polling progress via
	 * {@link getRun} or cancelling via {@link cancelRun}.
	 *
	 * @param graph - Raw graph definition (validated and compiled internally).
	 * @param connections - Connection credentials keyed by UUID.
	 * @param options - Optional abort signal and context-update callback.
	 * @returns Unique run ID (UUID).
	 * @throws {ValidationError} If graph or connections fail validation.
	 */
	execute(
		graph: unknown,
		connections: Connections,
		options?: ExecuteOptions,
	): string {
		const plan = this.#compile(graph, connections);
		return this.#runs.submit({
			runId: crypto.randomUUID(),
			plan,
			connections,
			registry: this.#registry,
			executor: execute,
			...(options && { options }),
		});
	}

	/**
	 * Execute a graph and await the result.
	 *
	 * Unlike {@link execute}, this method resolves only when the entire
	 * graph has finished (or an abort signal fires). Use this for
	 * scripting, tests, or any context where you need the result inline.
	 *
	 * @param graph - Raw graph definition (validated and compiled internally).
	 * @param connections - Connection credentials keyed by UUID.
	 * @param options - Optional abort signal and context-update callback.
	 * @throws {ValidationError} If graph or connections fail validation.
	 * @throws {CancellationError} If execution is aborted.
	 */
	async executeSync(
		graph: unknown,
		connections: Connections,
		options?: ExecuteOptions,
	): Promise<RunResult> {
		const plan = this.#compile(graph, connections);
		return execute(plan, connections, this.#registry, options);
	}

	/**
	 * Get the current state of a run.
	 *
	 * Returns per-node progress, overall status, and (once finished) the
	 * final {@link RunResult}. Returns `undefined` if the run ID is unknown
	 * or has already been cleaned up (see {@link RunManager} TTL).
	 */
	getRun(runId: string): RunState | undefined {
		return this.#runs.get(runId);
	}

	/**
	 * List all tracked runs, optionally filtered by status.
	 *
	 * @param status - If provided, only runs in this lifecycle phase are returned.
	 */
	listRuns(status?: RunStatus): RunSummary[] {
		return this.#runs.list(status);
	}

	/**
	 * Request cancellation of a running or pending execution.
	 *
	 * Signals the run's internal {@link AbortController}; nodes that
	 * have already completed are unaffected. Returns `false` if the
	 * run was not found or already finished.
	 */
	cancelRun(runId: string): boolean {
		return this.#runs.cancel(runId);
	}

	#compile(graph: unknown, connections: Connections): ExecutionPlan {
		const validation = this.validate(graph, connections);
		if (!validation.valid) {
			throw new ValidationError(
				`Graph validation failed: ${validation.errors.join("; ")}`,
				{
					source: "engine",
					retryable: false,
					details: { errors: validation.errors },
				},
			);
		}
		return compile(graph, this.#registry);
	}
}
