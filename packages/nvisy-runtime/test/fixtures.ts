import type { Resumable } from "@nvisy/core";
import { Action, Data, Module, Provider, Row, Stream } from "@nvisy/core";
import { z } from "zod";
import { Engine } from "../src/engine/engine.js";
import type { Connections } from "../src/engine/types.js";
import { Registry } from "../src/registry.js";

export const GRAPH_ID = "00000000-0000-4000-8000-000000000000";
export const SOURCE_ID = "00000000-0000-4000-8000-000000000001";
export const ACTION_ID = "00000000-0000-4000-8000-000000000002";
export const TARGET_ID = "00000000-0000-4000-8000-000000000003";
export const EXTRA_ID = "00000000-0000-4000-8000-000000000004";
export const CRED_ID = "00000000-0000-4000-8000-0000000000c0";

const NoopParams = z.object({});

export const noopAction = Action.withoutClient("noop", {
	types: [Data],
	params: NoopParams,
	transform: (stream, _params) => stream,
});

const TestCredentials = z.object({ host: z.string() });

class TestClient {}

export const testProvider = Provider.withAuthentication("testdb", {
	credentials: TestCredentials,
	connect: async (_creds) => ({
		client: new TestClient(),
	}),
});

// ── Mock streams ──────────────────────────────────────────────────

const TestContext = z.object({
	cursor: z.string().nullable().default(null),
});

const TestParams = z.record(z.string(), z.unknown());

/**
 * Items produced by the mock source stream.
 * Exposed so tests can assert on them.
 */
export const sourceRows: Row[] = [
	new Row({ name: "Alice", age: 30 }),
	new Row({ name: "Bob", age: 25 }),
	new Row({ name: "Carol", age: 35 }),
];

export const testSourceStream = Stream.createSource("read", TestClient, {
	types: [Row, TestContext, TestParams],
	reader: async function* (_client, _ctx, _params) {
		for (const row of sourceRows) {
			yield { data: row, context: { cursor: row.id } } as Resumable<
				Row,
				z.infer<typeof TestContext>
			>;
		}
	},
});

/**
 * Items written to the mock target stream.
 * Tests can inspect this array after execution.
 */
export const writtenItems: Data[] = [];

export const testTargetStream = Stream.createTarget("write", TestClient, {
	types: [Row, TestParams],
	writer: (_client, _params) => {
		return async (item: Row) => {
			writtenItems.push(item);
		};
	},
});

// ── Module ────────────────────────────────────────────────────────

export const testModule = Module.define("test")
	.withActions(noopAction)
	.withProviders(testProvider)
	.withStreams(testSourceStream, testTargetStream);

/**
 * Create a Registry pre-loaded with the test module.
 */
export function makeTestRegistry(): Registry {
	const registry = new Registry();
	registry.load(testModule);
	return registry;
}

/**
 * Create an Engine pre-loaded with the test module.
 */
export function makeTestEngine(): Engine {
	return new Engine().register(testModule);
}

/**
 * Default credential map matching the test provider's schema.
 */
export function testCredentials() {
	return { [CRED_ID]: { host: "localhost" } };
}

/**
 * Default connections map matching the test provider's schema.
 */
export function testConnections(): Connections {
	return {
		[CRED_ID]: {
			type: "testdb",
			credentials: { host: "localhost" },
			context: {},
		},
	};
}

export function linearGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{
				id: SOURCE_ID,
				type: "source" as const,
				provider: "test/testdb",
				stream: "test/read",
				credentials: CRED_ID,
				params: { table: "users" },
			},
			{
				id: ACTION_ID,
				type: "action" as const,
				action: "test/noop",
				params: {},
			},
			{
				id: TARGET_ID,
				type: "target" as const,
				provider: "test/testdb",
				stream: "test/write",
				credentials: CRED_ID,
				params: { table: "output" },
			},
		],
		edges: [
			{ from: SOURCE_ID, to: ACTION_ID },
			{ from: ACTION_ID, to: TARGET_ID },
		],
	};
}

export function isolatedNodesGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{
				id: SOURCE_ID,
				type: "source" as const,
				provider: "test/testdb",
				stream: "test/read",
				credentials: CRED_ID,
				params: { table: "users" },
			},
			{
				id: ACTION_ID,
				type: "action" as const,
				action: "test/noop",
				params: {},
			},
		],
		edges: [],
	};
}

export function diamondGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{
				id: SOURCE_ID,
				type: "source" as const,
				provider: "test/testdb",
				stream: "test/read",
				credentials: CRED_ID,
				params: { table: "users" },
			},
			{
				id: ACTION_ID,
				type: "action" as const,
				action: "test/noop",
				params: {},
			},
			{
				id: EXTRA_ID,
				type: "action" as const,
				action: "test/noop",
				params: {},
			},
			{
				id: TARGET_ID,
				type: "target" as const,
				provider: "test/testdb",
				stream: "test/write",
				credentials: CRED_ID,
				params: { table: "output" },
			},
		],
		edges: [
			{ from: SOURCE_ID, to: ACTION_ID },
			{ from: SOURCE_ID, to: EXTRA_ID },
			{ from: ACTION_ID, to: TARGET_ID },
			{ from: EXTRA_ID, to: TARGET_ID },
		],
	};
}
