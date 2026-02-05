/**
 * Run management for background graph executions.
 *
 * This module provides:
 * - Tracking of in-flight and completed runs
 * - Progress monitoring at the node level
 * - Cancellation support via AbortController
 * - Automatic cleanup of completed runs after TTL
 */

import { getLogger } from "@logtape/logtape";
import type { ExecutionPlan } from "../compiler/index.js";
import type {
	Connections,
	ExecuteOptions,
	NodeProgress,
	RunResult,
	RunState,
	RunStatus,
	RunSummary,
} from "./types.js";

const logger = getLogger(["nvisy", "runtime", "runs"]);

/**
 * Function signature for executing a plan.
 *
 * Used for dependency injection in RunManager, allowing
 * the executor to be swapped for testing.
 */
export type PlanExecutor = (
	plan: ExecutionPlan,
	connections: Connections,
	options?: ExecuteOptions,
) => Promise<RunResult>;

/** Internal mutable state for a run. */
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

/** Create an immutable RunState snapshot from mutable internal state. */
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

/** Create a RunSummary from mutable internal state. */
function createRunSummary(run: MutableRun): RunSummary {
	return {
		runId: run.runId,
		status: run.status,
		startedAt: run.startedAt,
		...(run.completedAt && { completedAt: run.completedAt }),
	};
}

/** Create initial or updated NodeProgress. */
function createNodeProgress(
	nodeId: string,
	result?: { status: string; itemsProcessed: number; error?: Error },
): NodeProgress {
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
 * Provides:
 * - Background execution with progress tracking
 * - Run state queries (get, list)
 * - Cancellation support
 * - Automatic cleanup after TTL expiry
 *
 * @example
 * ```ts
 * const manager = new RunManager({ ttlMs: 5 * 60 * 1000 });
 * const runId = manager.submit(id, plan, connections, executor);
 *
 * // Check progress
 * const state = manager.get(runId);
 * console.log(state?.status, state?.nodeProgress);
 *
 * // Cancel if needed
 * manager.cancel(runId);
 * ```
 */
export class RunManager {
	readonly #runs = new Map<string, MutableRun>();
	readonly #ttlMs: number;

	/**
	 * Create a new RunManager.
	 *
	 * @param options.ttlMs - Time to keep completed runs before cleanup (default: 5 minutes).
	 */
	constructor(options?: { ttlMs?: number }) {
		this.#ttlMs = options?.ttlMs ?? 5 * 60 * 1000;
	}

	/**
	 * Submit a graph for background execution.
	 *
	 * Starts execution immediately and returns the run ID.
	 * Use {@link get} to monitor progress or {@link cancel} to abort.
	 *
	 * @param runId - Unique identifier for this run.
	 * @param plan - Compiled execution plan.
	 * @param connections - Connection credentials.
	 * @param executor - Function to execute the plan.
	 * @param options - Execution options (merged with internal abort signal).
	 * @returns The run ID.
	 */
	submit(
		runId: string,
		plan: ExecutionPlan,
		connections: Connections,
		executor: PlanExecutor,
		options?: ExecuteOptions,
	): string {
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

		this.#executeInBackground(run, plan, connections, executor, options);

		return runId;
	}

	/**
	 * Get the current state of a run.
	 *
	 * Returns a snapshot of the run state including per-node progress.
	 * Returns undefined if the run doesn't exist or has been cleaned up.
	 */
	get(runId: string): RunState | undefined {
		const run = this.#runs.get(runId);
		return run ? createRunState(run) : undefined;
	}

	/**
	 * List all runs, optionally filtered by status.
	 *
	 * Returns summaries (without full progress details) for efficiency.
	 */
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
	 * Signals the abort controller, which will halt the Effection task.
	 * The run will transition to "cancelled" status.
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

	/** Check if a run exists (may be completed but not yet cleaned up). */
	has(runId: string): boolean {
		return this.#runs.has(runId);
	}

	/** Execute the plan in the background and update run state. */
	async #executeInBackground(
		run: MutableRun,
		plan: ExecutionPlan,
		connections: Connections,
		executor: PlanExecutor,
		options?: ExecuteOptions,
	): Promise<void> {
		run.status = "running";
		logger.info("Run started: {runId}", { runId: run.runId });

		// Combine user signal with internal abort controller
		const signal = options?.signal
			? AbortSignal.any([options.signal, run.abort.signal])
			: run.abort.signal;

		try {
			const result = await executor(plan, connections, {
				...options,
				signal,
				onContextUpdate: (nodeId, connectionId, context) => {
					// Update node progress on each item
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

			// Update final node progress from results
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

	/** Schedule cleanup of a completed run after TTL. */
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
