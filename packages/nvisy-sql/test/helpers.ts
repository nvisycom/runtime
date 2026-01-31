import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { PgClient } from "@effect/sql-pg";
import { Reactivity } from "@effect/experimental";
import type { Connection } from "@effect/sql/SqlConnection";
import { makeSqlProvider } from "../src/shared/sql-provider.js";
import type { SqlCredentials, SqlParams } from "../src/shared/schemas.js";

export const mockRows = [
	{ id: 1, name: "Alice", created_at: 100 },
	{ id: 2, name: "Bob", created_at: 200 },
	{ id: 3, name: "Charlie", created_at: 300 },
];

export let executedQueries: Array<{
	sql: string;
	params: ReadonlyArray<unknown>;
}> = [];

export function resetQueries(): void {
	executedQueries = [];
}

function createMockConnection(): Connection {
	return {
		execute: (sql, params, _transform) =>
			Effect.sync(() => {
				executedQueries.push({ sql, params });

				if (sql.includes("SELECT")) {
					const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
					const limit = limitMatch ? Number(limitMatch[1]) : mockRows.length;

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
				executedQueries.push({ sql, params });
				return [];
			}),
		executeStream: () => {
			throw new Error("Not implemented");
		},
		executeValues: (sql, params) =>
			Effect.sync(() => {
				executedQueries.push({ sql, params });
				return [];
			}),
		executeUnprepared: (sql, params, _transform) =>
			Effect.sync(() => {
				executedQueries.push({ sql, params });
				return [];
			}),
	};
}

function createMockSqlLayer(): Layer.Layer<SqlClient.SqlClient, never> {
	const compiler = PgClient.makeCompiler();
	return Layer.effect(
		SqlClient.SqlClient,
		SqlClient.make({
			acquirer: Effect.succeed(createMockConnection()),
			compiler,
			spanAttributes: [],
		}),
	).pipe(Layer.provide(Reactivity.layer));
}

export const mockProvider = makeSqlProvider({
	id: "mock-sql",
	makeLayer: () => createMockSqlLayer(),
});

export const testCreds: SqlCredentials = {
	host: "localhost",
	port: 5432,
	database: "testdb",
	username: "admin",
	password: "secret",
};

export const testParams: SqlParams = {
	table: "users",
	columns: [],
	idColumn: "id",
	tiebreaker: "created_at",
	batchSize: 1000,
};
