/**
 * Run management for background graph executions.
 *
 * Provides:
 * - Tracking of in-flight and completed runs
 * - Progress monitoring at the node level
 * - Cancellation support via AbortController
 * - Automatic cleanup of completed runs after TTL
 */

import { getLogger } from "@logtape/logtape";
import type { ExecutionPlan } from "../compiler/index.js";
import type { Registry } from "../registry.js";
import type { Connections } from "./connections.js";
import type { ExecuteOptions, RunResult } from "./executor.js";
import type { NodeResult } from "./nodes.js";

const logger = getLogger(["nvisy", "runs"]);

/**
 * Lifecycle status of a background execution run.
 *
 * Transitions: pending → running → completed | failed | cancelled
 */
export type RunStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

/** Progress of a single node within a run. */
export interface NodeProgress {
	readonly nodeId: string;
	readonly status: "pending" | "running" | "completed" | "failed";
	readonly itemsProcessed: number;
	readonly error?: Error;
}

/**
 * Complete state of an execution run.
 *
 * Includes per-node progress for monitoring long-running executions.
 */
export interface RunState {
	readonly runId: string;
	readonly status: RunStatus;
	readonly startedAt: Date;
	readonly completedAt?: Date;
	readonly nodeProgress: ReadonlyMap<string, NodeProgress>;
	readonly result?: RunResult;
	readonly error?: Error;
}

/** Summary of a run for listing (without full progress details). */
export interface RunSummary {
	readonly runId: string;
	readonly status: RunStatus;
	readonly startedAt: Date;
	readonly completedAt?: Date;
}

/** Function signature for executing a plan. */
export type PlanExecutor = (
	plan: ExecutionPlan,
	connections: Connections,
	registry: Registry,
	options?: ExecuteOptions,
) => Promise<RunResult>;

/** Configuration for submitting a graph execution. */
export interface SubmitConfig {
	readonly runId: string;
	readonly plan: ExecutionPlan;
	readonly connections: Connections;
	readonly registry: Registry;
	readonly executor: PlanExecutor;
	readonly options?: ExecuteOptions;
}

interface MutableRun {
	runId: string;
	status: RunStatus;
	startedAt: Date;
	completedAt: Date | null;
	nodeProgress: Map<string, NodeProgress>;
	result: RunResult | null;
	error: Error | null;
	abort: AbortController;
}

function createRunState(run: MutableRun): RunState {
	return {
		runId: run.runId,
		status: run.status,
		startedAt: run.startedAt,
		nodeProgress: new Map(run.nodeProgress),
		...(run.completedAt && { completedAt: run.completedAt }),
		...(run.result && { result: run.result }),
		...(run.error && { error: run.error }),
	};
}

function createRunSummary(run: MutableRun): RunSummary {
	return {
		runId: run.runId,
		status: run.status,
		startedAt: run.startedAt,
		...(run.completedAt && { completedAt: run.completedAt }),
	};
}

function createNodeProgress(nodeId: string, result?: NodeResult): NodeProgress {
	return {
		nodeId,
		status: result
			? result.status === "success"
				? "completed"
				: "failed"
			: "pending",
		itemsProcessed: result?.itemsProcessed ?? 0,
		...(result?.error && { error: result.error }),
	};
}

/**
 * Manages in-flight and recently completed graph executions.
 *
 * @example
 * ```ts
 * const manager = new RunManager({ ttlMs: 5 * 60 * 1000 });
 * const runId = manager.submit({ runId: id, plan, connections, registry, executor });
 *
 * const state = manager.get(runId);
 * console.log(state?.status, state?.nodeProgress);
 *
 * manager.cancel(runId);
 * ```
 */
export class RunManager {
	readonly #runs = new Map<string, MutableRun>();
	readonly #ttlMs: number;

	constructor(options?: { ttlMs?: number }) {
		this.#ttlMs = options?.ttlMs ?? 5 * 60 * 1000;
	}

	/**
	 * Submit a graph for background execution.
	 *
	 * Starts execution immediately and returns the run ID.
	 * Use {@link get} to monitor progress or {@link cancel} to abort.
	 */
	submit(config: SubmitConfig): string {
		const { runId, plan, connections, registry, executor, options } = config;

		const run: MutableRun = {
			runId,
			status: "pending",
			startedAt: new Date(),
			completedAt: null,
			nodeProgress: new Map(
				plan.order.map((id) => [id, createNodeProgress(id)]),
			),
			result: null,
			error: null,
			abort: new AbortController(),
		};

		this.#runs.set(runId, run);
		logger.info("Run submitted: {runId}", { runId });

		this.#executeInBackground(run, {
			plan,
			connections,
			registry,
			executor,
			...(options && { options }),
		});

		return runId;
	}

	/** Get the current state of a run. */
	get(runId: string): RunState | undefined {
		const run = this.#runs.get(runId);
		return run ? createRunState(run) : undefined;
	}

	/** List all runs, optionally filtered by status. */
	list(status?: RunStatus): RunSummary[] {
		const summaries: RunSummary[] = [];
		for (const run of this.#runs.values()) {
			if (!status || run.status === status) {
				summaries.push(createRunSummary(run));
			}
		}
		return summaries;
	}

	/**
	 * Request cancellation of a running execution.
	 *
	 * @returns True if cancellation was requested, false if run not found or already completed.
	 */
	cancel(runId: string): boolean {
		const run = this.#runs.get(runId);
		if (!run || (run.status !== "pending" && run.status !== "running")) {
			return false;
		}

		run.abort.abort();
		logger.info("Run cancellation requested: {runId}", { runId });
		return true;
	}

	/** Check if a run exists. */
	has(runId: string): boolean {
		return this.#runs.has(runId);
	}

	async #executeInBackground(
		run: MutableRun,
		config: Omit<SubmitConfig, "runId">,
	): Promise<void> {
		const { plan, connections, registry, executor, options } = config;

		run.status = "running";
		logger.info("Run started: {runId}", { runId: run.runId });

		const signal = options?.signal
			? AbortSignal.any([options.signal, run.abort.signal])
			: run.abort.signal;

		try {
			const result = await executor(plan, connections, registry, {
				...options,
				signal,
				onContextUpdate: (nodeId, connectionId, context) => {
					const progress = run.nodeProgress.get(nodeId);
					if (progress) {
						run.nodeProgress.set(nodeId, {
							...progress,
							status: "running",
							itemsProcessed: progress.itemsProcessed + 1,
						});
					}
					options?.onContextUpdate?.(nodeId, connectionId, context);
				},
			});

			run.status = "completed";
			run.completedAt = new Date();
			run.result = result;

			for (const nodeResult of result.nodes) {
				run.nodeProgress.set(
					nodeResult.nodeId,
					createNodeProgress(nodeResult.nodeId, nodeResult),
				);
			}

			logger.info("Run completed: {runId} (status={status})", {
				runId: run.runId,
				status: result.status,
			});
		} catch (error) {
			run.completedAt = new Date();

			if (run.abort.signal.aborted) {
				run.status = "cancelled";
				logger.info("Run cancelled: {runId}", { runId: run.runId });
			} else {
				run.status = "failed";
				run.error = error instanceof Error ? error : new Error(String(error));
				logger.error("Run failed: {runId} (error={error})", {
					runId: run.runId,
					error: run.error.message,
				});
			}
		}

		this.#scheduleCleanup(run.runId);
	}

	#scheduleCleanup(runId: string): void {
		setTimeout(() => {
			const run = this.#runs.get(runId);
			if (run?.completedAt) {
				this.#runs.delete(runId);
				logger.debug("Run cleaned up: {runId}", { runId });
			}
		}, this.#ttlMs);
	}
}
