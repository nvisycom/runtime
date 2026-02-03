import { Action, Data, Module, Provider } from "@nvisy/core";
import { z } from "zod";
import { Registry } from "../src/registry/index.js";

export const GRAPH_ID = "00000000-0000-4000-8000-000000000000";
export const SOURCE_ID = "00000000-0000-4000-8000-000000000001";
export const ACTION_ID = "00000000-0000-4000-8000-000000000002";
export const TARGET_ID = "00000000-0000-4000-8000-000000000003";
export const EXTRA_ID = "00000000-0000-4000-8000-000000000004";

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

export const testModule = Module.define("test")
	.withActions(noopAction)
	.withProviders(testProvider);

/**
 * Create a Registry pre-loaded with the test module.
 */
export function makeTestRegistry(): Registry {
	const registry = new Registry();
	registry.loadModule(testModule);
	return registry;
}

export function linearGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{
				id: SOURCE_ID,
				type: "source" as const,
				provider: "test/testdb",
				params: { host: "localhost", table: "users" },
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
				params: { host: "localhost", table: "output" },
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
				params: { host: "localhost", table: "users" },
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
				params: { host: "localhost", table: "users" },
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
				params: { host: "localhost", table: "output" },
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
