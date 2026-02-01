import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { PgClient } from "@effect/sql-pg";
import { Reactivity } from "@effect/experimental";
import type { Connection } from "@effect/sql/SqlConnection";
import { makeSqlProvider, SqlRuntimeClient } from "../src/providers/base.js";
import type { SqlCredentials } from "../src/providers/base.js";
import type { SqlParams } from "../src/streams/schemas.js";

export const mockRows = [
	{ id: 1, name: "Alice", created_at: 100 },
	{ id: 2, name: "Bob", created_at: 200 },
	{ id: 3, name: "Charlie", created_at: 300 },
];

export interface QueryRecord {
	sql: string;
	params: ReadonlyArray<unknown>;
}

function createMockConnection(queries: QueryRecord[]): Connection {
	return {
		execute: (sql, params, _transform) =>
			Effect.sync(() => {
				queries.push({ sql, params });

				if (sql.includes("SELECT")) {
					const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
					const limit = limitMatch
						? Number(limitMatch[1])
						: mockRows.length;

					if (sql.includes(">")) {
						const [lastId] = params;
						const startIdx = mockRows.findIndex(
							(r) => r.id > (lastId as number),
						);
						if (startIdx === -1)
							return [] as ReadonlyArray<Record<string, unknown>>;
						return mockRows.slice(
							startIdx,
							startIdx + limit,
						) as ReadonlyArray<Record<string, unknown>>;
					}

					return mockRows.slice(0, limit) as ReadonlyArray<
						Record<string, unknown>
					>;
				}

				return [] as ReadonlyArray<Record<string, unknown>>;
			}),
		executeRaw: (sql, params) =>
			Effect.sync(() => {
				queries.push({ sql, params });
				return [];
			}),
		executeStream: () => {
			throw new Error("Not implemented");
		},
		executeValues: (sql, params) =>
			Effect.sync(() => {
				queries.push({ sql, params });
				return [];
			}),
		executeUnprepared: (sql, params, _transform) =>
			Effect.sync(() => {
				queries.push({ sql, params });
				return [];
			}),
	};
}

function createMockSqlLayer(
	queries: QueryRecord[],
): Layer.Layer<SqlClient.SqlClient, never> {
	const compiler = PgClient.makeCompiler();
	return Layer.effect(
		SqlClient.SqlClient,
		SqlClient.make({
			acquirer: Effect.succeed(createMockConnection(queries)),
			compiler,
			spanAttributes: [],
		}),
	).pipe(Layer.provide(Reactivity.layer));
}

/**
 * Create an isolated mock provider with its own query log.
 *
 * Each call returns a fresh provider factory and an empty query array,
 * so tests never share mutable state.
 */
export function createMockProvider(overrides?: Partial<SqlParams>) {
	const queries: QueryRecord[] = [];

	const provider = makeSqlProvider({
		id: "mock",
		makeLayer: () => createMockSqlLayer(queries),
	});

	const params: SqlParams = {
		table: "users",
		columns: [],
		idColumn: "id",
		tiebreaker: "created_at",
		batchSize: 1000,
		...overrides,
	};

	return { provider, queries, params };
}

export const testCreds: SqlCredentials = {
	host: "localhost",
	port: 5432,
	database: "testdb",
	username: "admin",
	password: "secret",
};
