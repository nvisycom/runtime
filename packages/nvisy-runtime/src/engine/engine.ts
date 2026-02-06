/**
 * Primary runtime entry point.
 *
 * Coordinates plugin registration, graph validation, and execution.
 * Delegates actual graph execution to the executor module and run
 * tracking to the RunManager.
 *
 * @example
 * ```ts
 * const engine = new Engine();
 * engine.register(sqlPlugin);
 * const runId = engine.execute(graph, connections);
 * const state = engine.getRun(runId);
 * ```
 */

import type { PluginInstance } from "@nvisy/core";
import { corePlugin, ValidationError } from "@nvisy/core";
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

/** Result of graph validation. */
export interface ValidationResult {
	readonly valid: boolean;
	readonly errors: ReadonlyArray<string>;
}

export class Engine {
	readonly #registry = new Registry();
	readonly #runs = new RunManager();

	constructor() {
		this.#registry.load(corePlugin);
	}

	/** Snapshot of all registered actions and providers with their schemas. */
	get schema(): RegistrySchema {
		return this.#registry.schema;
	}

	/** Register a plugin's providers, actions, and streams. */
	register(plugin: PluginInstance): this {
		this.#registry.load(plugin);
		return this;
	}

	/**
	 * Validate a graph definition and connections without executing.
	 *
	 * Checks graph structure (parse, cycles, dangling edges, name resolution)
	 * and validates each connection's credentials against its provider schema.
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
	 * Returns immediately with a runId for tracking progress,
	 * retrieving results, or cancelling execution.
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
	 * Execute a graph synchronously.
	 *
	 * Blocks until execution completes. For background execution, use {@link execute}.
	 */
	async executeSync(
		graph: unknown,
		connections: Connections,
		options?: ExecuteOptions,
	): Promise<RunResult> {
		const plan = this.#compile(graph, connections);
		return execute(plan, connections, this.#registry, options);
	}

	/** Get the current state of a run by its ID. */
	getRun(runId: string): RunState | undefined {
		return this.#runs.get(runId);
	}

	/** List all runs, optionally filtered by status. */
	listRuns(status?: RunStatus): RunSummary[] {
		return this.#runs.list(status);
	}

	/** Cancel a running execution. */
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
