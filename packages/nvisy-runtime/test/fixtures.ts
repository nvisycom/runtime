import { Effect, Layer } from "effect";
import { Module, Action, Provider, Data } from "@nvisy/core";
import { Schema } from "effect";
import { Registry } from "../src/registry/index.js";

// ── Stable UUIDs for test fixtures ────────────────────────────────────

export const GRAPH_ID = "00000000-0000-4000-8000-000000000000";
export const SOURCE_ID = "00000000-0000-4000-8000-000000000001";
export const ACTION_ID = "00000000-0000-4000-8000-000000000002";
export const TARGET_ID = "00000000-0000-4000-8000-000000000003";
export const EXTRA_ID = "00000000-0000-4000-8000-000000000004";
export const BRANCH_ID = "00000000-0000-4000-8000-000000000005";

// ── Test action ───────────────────────────────────────────────────────

const NoopParams = Schema.Struct({});

export const noopAction = Action.withoutClient("noop", {
	types: [Data],
	params: NoopParams,
	execute: async (items, _params) => [...items],
});

// ── Test provider ─────────────────────────────────────────────────────

const TestCredentials = Schema.Struct({ host: Schema.String });

class TestClient {}

export const testProvider = Provider.withAuthentication("testdb", {
	credentials: TestCredentials,
	connect: async (_creds) => ({
		client: new TestClient(),
	}),
});

// ── Test module ───────────────────────────────────────────────────────

export const testModule = Module.define("test")
	.withActions(noopAction)
	.withProviders(testProvider);

// ── Registry layer with test module loaded ────────────────────────────

export const TestRegistryLayer = Layer.effect(
	Registry,
	Effect.gen(function* () {
		const registry = yield* Layer.build(Registry.Live).pipe(
			Effect.map((ctx) => ctx.pipe(Effect.provideService(Registry, ctx.unsafeGet(Registry)))),
			Effect.flatten,
		);
		// We build the live registry, load the module, and return it.
		return registry;
	}),
);

// Simpler approach: build live registry and load module in one go
export const makeTestRegistry = Effect.gen(function* () {
	const registry = yield* Registry;
	yield* registry.loadModule(testModule);
	return registry;
});

export const TestRegistry = Registry.Live;

// ── Graph factory helpers ─────────────────────────────────────────────

export function linearGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{ id: SOURCE_ID, type: "source" as const, connector: "test/testdb", config: { host: "localhost", table: "users" } },
			{ id: ACTION_ID, type: "action" as const, action: "test/noop", config: {} },
			{ id: TARGET_ID, type: "target" as const, connector: "test/testdb", config: { host: "localhost", table: "output" } },
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
			{ id: SOURCE_ID, type: "source" as const, connector: "test/testdb", config: { host: "localhost", table: "users" } },
			{ id: ACTION_ID, type: "action" as const, action: "test/noop", config: {} },
		],
		edges: [],
	};
}

export function diamondGraph() {
	return {
		id: GRAPH_ID,
		nodes: [
			{ id: SOURCE_ID, type: "source" as const, connector: "test/testdb", config: { host: "localhost", table: "users" } },
			{ id: ACTION_ID, type: "action" as const, action: "test/noop", config: {} },
			{ id: EXTRA_ID, type: "action" as const, action: "test/noop", config: {} },
			{ id: TARGET_ID, type: "target" as const, connector: "test/testdb", config: { host: "localhost", table: "output" } },
		],
		edges: [
			{ from: SOURCE_ID, to: ACTION_ID },
			{ from: SOURCE_ID, to: EXTRA_ID },
			{ from: ACTION_ID, to: TARGET_ID },
			{ from: EXTRA_ID, to: TARGET_ID },
		],
	};
}

/**
 * Run an Effect that requires Registry, providing a live registry
 * with the test module pre-loaded.
 */
export const runWithRegistry = <A, E>(
	effect: Effect.Effect<A, E, Registry>,
): Promise<A> =>
	Effect.gen(function* () {
		const registry = yield* Registry;
		yield* registry.loadModule(testModule);
		return yield* effect;
	}).pipe(
		Effect.provide(Registry.Live),
		Effect.runPromise,
	);
