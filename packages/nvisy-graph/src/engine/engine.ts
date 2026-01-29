import { AsyncSemaphore } from "@nvisy/core";
import { WorkflowCompiler } from "../compiler/compiler.js";
import type { WorkflowDefinition } from "../definition/workflow.js";
import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from "./config.js";
import { ExecutionContext } from "./context.js";
import { Executor } from "./executor.js";

export interface ExecutionResult {
	status: "completed" | "failed";
	itemsProcessed: number;
	durationMs: number;
	errors: Error[];
}

export class Engine {
	private readonly config: EngineConfig;
	private readonly semaphore: AsyncSemaphore;

	constructor(config: Partial<EngineConfig> = {}) {
		this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
		this.semaphore = new AsyncSemaphore(this.config.maxConcurrentRuns);
	}

	async execute(definition: WorkflowDefinition): Promise<ExecutionResult> {
		const release = await this.semaphore.acquire();
		const start = Date.now();
		const errors: Error[] = [];
		const ctx = new ExecutionContext();

		try {
			const compiler = new WorkflowCompiler();
			const graph = compiler.compile(definition);
			const executor = new Executor(graph);
			await executor.execute(ctx);
			return {
				status: "completed",
				itemsProcessed: ctx.itemsProcessed,
				durationMs: Date.now() - start,
				errors,
			};
		} catch (error) {
			errors.push(error instanceof Error ? error : new Error(String(error)));
			return {
				status: "failed",
				itemsProcessed: ctx.itemsProcessed,
				durationMs: Date.now() - start,
				errors,
			};
		} finally {
			release();
		}
	}

	get availableSlots(): number {
		return this.semaphore.availablePermits;
	}
}
