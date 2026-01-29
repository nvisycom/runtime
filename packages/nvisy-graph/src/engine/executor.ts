import type { CompiledGraph } from "../graph/compiled-graph.js";
import type { ExecutionContext } from "./context.js";

export class Executor {
	constructor(private readonly graph: CompiledGraph) {}

	async execute(ctx: ExecutionContext): Promise<void> {
		throw new Error("Not yet implemented");
	}
}
