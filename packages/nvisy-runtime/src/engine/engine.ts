import type { PluginInstance } from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { compile, type ExecutionPlan } from "../compiler/index.js";
import { Registry, type RegistrySchema } from "../registry.js";
import { execute } from "./runner.js";
import type {
	Connections,
	ExecuteOptions,
	RunResult,
	ValidationResult,
} from "./types.js";
import { ConnectionsSchema } from "./types.js";

/**
 * Primary runtime entry point.
 *
 * Owns the internal {@link Registry}, validates graphs and connections,
 * and executes pipelines.
 *
 * ```ts
 * const engine = new Engine();
 * engine.register(sqlPlugin);
 * const result = await engine.execute(graphDefinition, connections);
 * ```
 */
export class Engine {
	readonly #registry = new Registry();

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

		this.#validateConnectionsShape(connections, errors);

		const plan = this.#tryCompile(graph, errors);
		if (!plan) {
			return { valid: false, errors };
		}

		this.#validateNodeConnections(plan, connections, errors);

		return { valid: errors.length === 0, errors };
	}

	#validateConnectionsShape(connections: Connections, errors: string[]): void {
		const result = ConnectionsSchema.safeParse(connections);
		if (!result.success) {
			errors.push(...result.error.issues.map((i) => i.message));
		}
	}

	#tryCompile(graph: unknown, errors: string[]): ExecutionPlan | null {
		try {
			return compile(graph, this.#registry);
		} catch (e) {
			errors.push(e instanceof Error ? e.message : String(e));
			return null;
		}
	}

	#validateNodeConnections(
		plan: ExecutionPlan,
		connections: Connections,
		errors: string[],
	): void {
		for (const node of plan.definition.nodes) {
			if (node.type === "source" || node.type === "target") {
				const conn = connections[node.connection];
				if (!conn) {
					errors.push(
						`Missing connection "${node.connection}" for node ${node.id}`,
					);
					continue;
				}

				const resolved = plan.resolved.get(node.id);
				if (
					!resolved ||
					(resolved.type !== "source" && resolved.type !== "target")
				) {
					continue;
				}

				try {
					resolved.provider.credentialSchema.parse(conn.credentials);
				} catch (e) {
					errors.push(
						`Invalid credentials for node ${node.id}: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			} else if (node.type === "action" && node.provider && node.connection) {
				const conn = connections[node.connection];
				if (!conn) {
					errors.push(
						`Missing connection "${node.connection}" for action node ${node.id}`,
					);
					continue;
				}

				const resolved = plan.resolved.get(node.id);
				if (!resolved || resolved.type !== "action" || !resolved.provider) {
					continue;
				}

				try {
					resolved.provider.credentialSchema.parse(conn.credentials);
				} catch (e) {
					errors.push(
						`Invalid credentials for action node ${node.id}: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			}
		}
	}

	/**
	 * Validate, compile, and execute a graph definition.
	 *
	 * @param graph - Raw graph definition (parsed and validated internally).
	 * @param connections - Connection map keyed by UUID.
	 * @param options - Abort signal, context update callback, etc.
	 */
	async execute(
		graph: unknown,
		connections: Connections,
		options?: ExecuteOptions,
	): Promise<RunResult> {
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

		const plan = compile(graph, this.#registry);
		return execute(plan, connections, options);
	}
}
