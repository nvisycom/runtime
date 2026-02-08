/**
 * Connection validation and types.
 *
 * A "connection" pairs a provider type with its credentials (and an
 * optional resumption context). Before graph execution, every
 * connection referenced by the plan is validated upfront against its
 * provider's Zod credential schema via {@link validateConnections},
 * ensuring misconfigured credentials surface early rather than
 * mid-pipeline.
 *
 * @module
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
 * A connection whose credentials have passed provider-schema validation.
 *
 * Created by {@link validateConnections} before execution starts.
 * `credentials` is the Zod-parsed output (defaults applied, types
 * narrowed), ready to be passed directly to `provider.connect()`.
 */
export interface ValidatedConnection {
	/** The provider factory that owns this connection's credential schema. */
	readonly provider: AnyProviderFactory;
	/** Parsed credentials (output of `provider.credentialSchema.parse`). */
	readonly credentials: unknown;
	/** Optional resumption context carried from a previous run. */
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
 * Validate every connection referenced by the execution plan.
 *
 * Iterates through each plan node that has an associated connection,
 * resolves the connection entry from the `connections` map, and parses
 * its credentials against the provider's Zod schema. Missing or
 * invalid entries are collected and thrown as a single
 * {@link ValidationError} so callers see all problems at once.
 *
 * @returns Map of connection ID → validated connection, ready for execution.
 * @throws {ValidationError} If any connection is missing or has invalid credentials.
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
