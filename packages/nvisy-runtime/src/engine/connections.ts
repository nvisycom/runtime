/**
 * Connection validation and types.
 *
 * Validates connection credentials against provider schemas before
 * execution begins, ensuring all connections are valid upfront.
 */

import type { AnyProviderFactory } from "@nvisy/core";
import { ValidationError } from "@nvisy/core";
import { z } from "zod";
import type { ExecutionPlan } from "../compiler/index.js";
import type {
	ResolvedActionNode,
	ResolvedNode,
	ResolvedSourceNode,
	ResolvedTargetNode,
} from "../compiler/plan.js";

/** Schema for a single connection entry. */
export const ConnectionSchema = z.object({
	/** Provider type identifier (e.g., "postgres", "s3"). */
	type: z.string(),
	/** Provider-specific credentials (validated against provider schema at runtime). */
	credentials: z.unknown(),
	/** Optional resumption context for crash recovery. */
	context: z.unknown(),
});

/** Schema for the connections map (UUID keys). */
export const ConnectionsSchema = z.record(z.uuid(), ConnectionSchema);

/** A connection entry with credentials for a specific provider. */
export type Connection = z.infer<typeof ConnectionSchema>;

/**
 * Map of connection ID (UUID) to connection configuration.
 *
 * Connections are referenced by nodes in the graph definition.
 * Each connection specifies credentials that are validated against
 * the provider's credential schema before execution.
 */
export type Connections = z.infer<typeof ConnectionsSchema>;

/**
 * A connection with validated credentials.
 *
 * Created during upfront validation, credentials have been parsed
 * against the provider's schema and are ready for use.
 */
export interface ValidatedConnection {
	readonly provider: AnyProviderFactory;
	readonly credentials: unknown;
	readonly context: unknown;
}

interface ResolvedWithConnection {
	readonly provider: AnyProviderFactory;
	readonly connection: string;
}

function hasConnection(
	resolved: ResolvedNode,
): resolved is (ResolvedSourceNode | ResolvedTargetNode | ResolvedActionNode) &
	ResolvedWithConnection {
	return "connection" in resolved && resolved.connection !== undefined;
}

/**
 * Validate all connections referenced by the execution plan.
 *
 * Performs upfront validation of credentials against provider schemas.
 * This ensures all connections are valid before execution begins,
 * avoiding partial execution failures due to credential issues.
 */
export function validateConnections(
	plan: ExecutionPlan,
	connections: Connections,
): Map<string, ValidatedConnection> {
	const validated = new Map<string, ValidatedConnection>();
	const errors: string[] = [];

	for (const nodeId of plan.order) {
		const resolved = plan.resolved.get(nodeId);
		if (!resolved || !hasConnection(resolved)) continue;

		const connId = resolved.connection;
		if (validated.has(connId)) continue;

		const conn = connections[connId];
		if (!conn) {
			errors.push(`Missing connection "${connId}" for node ${nodeId}`);
			continue;
		}

		const result = resolved.provider.credentialSchema.safeParse(
			conn.credentials,
		);
		if (!result.success) {
			errors.push(
				`Invalid credentials for connection "${connId}": ${result.error.message}`,
			);
			continue;
		}

		validated.set(connId, {
			provider: resolved.provider,
			credentials: result.data,
			context: conn.context,
		});
	}

	if (errors.length > 0) {
		throw new ValidationError(errors.join("; "), {
			source: "engine",
			retryable: false,
			details: { errors },
		});
	}

	return validated;
}
