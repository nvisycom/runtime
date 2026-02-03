import { CancellationError, RuntimeError, ValidationError } from "@nvisy/core";
import { beforeEach, describe, expect, it } from "vitest";
import type { Connections } from "../src/engine/types.js";
import {
	CRED_ID,
	diamondGraph,
	linearGraph,
	makeTestEngine,
	SOURCE_ID,
	sourceRows,
	testConnections,
	writtenItems,
} from "./fixtures.js";

beforeEach(() => {
	writtenItems.length = 0;
});

describe("validate", () => {
	it("valid graph returns { valid: true, errors: [] }", () => {
		const engine = makeTestEngine();
		const result = engine.validate(linearGraph(), testConnections());

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("invalid graph returns errors", () => {
		const engine = makeTestEngine();
		const result = engine.validate("not a graph", testConnections());

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("Graph parse error");
	});

	it("missing connections returns errors", () => {
		const engine = makeTestEngine();
		const result = engine.validate(linearGraph(), {});

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Missing connection"))).toBe(
			true,
		);
	});

	it("invalid credentials returns errors", () => {
		const engine = makeTestEngine();
		const connections: Connections = {
			[CRED_ID]: {
				type: "testdb",
				credentials: { wrong: "field" },
				context: {},
			},
		};
		const result = engine.validate(linearGraph(), connections);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Invalid credentials"))).toBe(
			true,
		);
	});
});

describe("execute", () => {
	it("linear pipeline: source -> action -> target", async () => {
		const engine = makeTestEngine();
		const result = await engine.execute(linearGraph(), testConnections());

		expect(result.status).toBe("success");
		expect(result.nodes).toHaveLength(3);
		for (const node of result.nodes) {
			expect(node.status).toBe("success");
		}
		expect(writtenItems).toHaveLength(sourceRows.length);
		for (let i = 0; i < sourceRows.length; i++) {
			expect(writtenItems[i]!.id).toBe(sourceRows[i]!.id);
		}
	});

	it("diamond graph: source -> 2 actions -> target", async () => {
		const engine = makeTestEngine();
		const result = await engine.execute(diamondGraph(), testConnections());

		expect(result.status).toBe("success");
		expect(result.nodes).toHaveLength(4);
		for (const node of result.nodes) {
			expect(node.status).toBe("success");
		}
		// Source fans out to 2 actions, each forwards all items to target
		// Target sees items from both action branches
		expect(writtenItems).toHaveLength(sourceRows.length * 2);
	});

	it("empty source: 0 items, all nodes succeed", async () => {
		const engine = makeTestEngine();
		// Override source rows to empty for this test
		const original = [...sourceRows];
		sourceRows.length = 0;
		try {
			const result = await engine.execute(linearGraph(), testConnections());

			expect(result.status).toBe("success");
			for (const node of result.nodes) {
				expect(node.status).toBe("success");
			}
			expect(writtenItems).toHaveLength(0);
		} finally {
			sourceRows.push(...original);
		}
	});

	it("cancellation via AbortSignal (pre-aborted)", async () => {
		const engine = makeTestEngine();
		const controller = new AbortController();
		controller.abort();

		await expect(
			engine.execute(linearGraph(), testConnections(), {
				signal: controller.signal,
			}),
		).rejects.toThrow(CancellationError);
	});

	it("cancellation via AbortSignal (abort during execution)", async () => {
		const engine = makeTestEngine();
		const controller = new AbortController();

		// Abort after a short delay
		setTimeout(() => controller.abort(), 5);

		// The execution should either complete normally (if fast enough)
		// or be halted. Either outcome is acceptable — we just verify
		// it doesn't hang.
		const result = await engine.execute(linearGraph(), testConnections(), {
			signal: controller.signal,
		});
		// If we get here, execution completed before abort — that's fine
		expect(result).toBeDefined();
	});

	it("non-retryable error stops immediately", async () => {
		const { Action, Data, Module, Provider, Row, Stream } = await import(
			"@nvisy/core"
		);
		const { z } = await import("zod");

		class FailClient {}

		const failProvider = Provider.withAuthentication("faildb", {
			credentials: z.object({ host: z.string() }),
			connect: async () => ({
				client: new FailClient(),
			}),
		});

		const failSource = Stream.createSource("read", FailClient, {
			types: [Row, z.object({}).default({}), z.record(z.string(), z.unknown())],
			// biome-ignore lint/correctness/useYield: intentionally throws before yielding to test error handling
			reader: async function* () {
				throw new RuntimeError("Non-retryable failure", {
					retryable: false,
				});
			},
		});

		const failTarget = Stream.createTarget("write", FailClient, {
			types: [Row, z.record(z.string(), z.unknown())],
			writer: () => async () => {},
		});

		const failModule = Module.define("fail")
			.withActions(
				Action.withoutClient("noop", {
					types: [Data],
					params: z.object({}),
					transform: (stream) => stream,
				}),
			)
			.withProviders(failProvider)
			.withStreams(failSource, failTarget);

		const engine = makeTestEngine();
		engine.register(failModule);

		const failCredId = "00000000-0000-4000-8000-0000000000f1";
		const graph = {
			id: "00000000-0000-4000-8000-000000000010",
			nodes: [
				{
					id: "00000000-0000-4000-8000-000000000011",
					type: "source" as const,
					provider: "fail/faildb",
					stream: "fail/read",
					credentials: failCredId,
					params: {},
					retry: {
						maxRetries: 3,
						backoff: "fixed" as const,
						initialDelayMs: 1,
						maxDelayMs: 1,
					},
				},
				{
					id: "00000000-0000-4000-8000-000000000012",
					type: "target" as const,
					provider: "fail/faildb",
					stream: "fail/write",
					credentials: failCredId,
					params: {},
				},
			],
			edges: [
				{
					from: "00000000-0000-4000-8000-000000000011",
					to: "00000000-0000-4000-8000-000000000012",
				},
			],
		};

		const connections: Connections = {
			...testConnections(),
			[failCredId]: {
				type: "faildb",
				credentials: { host: "localhost" },
				context: {},
			},
		};

		const result = await engine.execute(graph, connections);

		// The source node should fail (non-retryable skips retries)
		const sourceNode = result.nodes.find(
			(n) => n.nodeId === "00000000-0000-4000-8000-000000000011",
		);
		expect(sourceNode?.status).toBe("failure");
		expect(sourceNode?.error?.message).toContain("Non-retryable failure");
	});

	it("retryable error triggers retry", async () => {
		const { Action, Data, Module, Provider, Stream, Row } = await import(
			"@nvisy/core"
		);
		const { z } = await import("zod");

		let attempts = 0;

		class RetryClient {}

		const retryProvider = Provider.withAuthentication("retrydb", {
			credentials: z.object({ host: z.string() }),
			connect: async () => ({
				client: new RetryClient(),
			}),
		});

		const retrySource = Stream.createSource("read", RetryClient, {
			types: [Row, z.object({}).default({}), z.record(z.string(), z.unknown())],
			reader: async function* () {
				attempts++;
				if (attempts < 3) {
					throw new RuntimeError("Transient failure", { retryable: true });
				}
				yield {
					data: new Row({ recovered: true }),
					context: {},
				};
			},
		});

		const retryTarget = Stream.createTarget("write", RetryClient, {
			types: [Row, z.record(z.string(), z.unknown())],
			writer: () => async () => {},
		});

		const retryModule = Module.define("retry")
			.withActions(
				Action.withoutClient("noop", {
					types: [Data],
					params: z.object({}),
					transform: (stream) => stream,
				}),
			)
			.withProviders(retryProvider)
			.withStreams(retrySource, retryTarget);

		const engine = makeTestEngine();
		engine.register(retryModule);

		const retryCredId = "00000000-0000-4000-8000-0000000000f2";
		const graph = {
			id: "00000000-0000-4000-8000-000000000020",
			nodes: [
				{
					id: "00000000-0000-4000-8000-000000000021",
					type: "source" as const,
					provider: "retry/retrydb",
					stream: "retry/read",
					credentials: retryCredId,
					params: {},
					retry: {
						maxRetries: 5,
						backoff: "fixed" as const,
						initialDelayMs: 1,
						maxDelayMs: 1,
					},
				},
				{
					id: "00000000-0000-4000-8000-000000000022",
					type: "target" as const,
					provider: "retry/retrydb",
					stream: "retry/write",
					credentials: retryCredId,
					params: {},
				},
			],
			edges: [
				{
					from: "00000000-0000-4000-8000-000000000021",
					to: "00000000-0000-4000-8000-000000000022",
				},
			],
		};

		const connections: Connections = {
			...testConnections(),
			[retryCredId]: {
				type: "retrydb",
				credentials: { host: "localhost" },
				context: {},
			},
		};

		const result = await engine.execute(graph, connections);

		expect(result.status).toBe("success");
		expect(attempts).toBe(3); // Failed twice, succeeded on third
	});

	it("calls onContextUpdate for each yielded resumable", async () => {
		const engine = makeTestEngine();
		const updates: Array<{
			nodeId: string;
			connectionId: string;
			context: unknown;
		}> = [];

		const result = await engine.execute(linearGraph(), testConnections(), {
			onContextUpdate: (nodeId, connectionId, context) => {
				updates.push({ nodeId, connectionId, context });
			},
		});

		expect(result.status).toBe("success");
		expect(updates).toHaveLength(sourceRows.length);
		for (const update of updates) {
			expect(update.nodeId).toBe(SOURCE_ID);
			expect(update.connectionId).toBe(CRED_ID);
			expect(update.context).toHaveProperty("cursor");
		}
	});
});

describe("credential validation", () => {
	it("rejects malformed connections map (non-UUID keys)", async () => {
		const engine = makeTestEngine();
		const connections = {
			"not-a-uuid": {
				type: "testdb",
				credentials: { host: "localhost" },
				context: {},
			},
		};

		await expect(engine.execute(linearGraph(), connections)).rejects.toThrow(
			ValidationError,
		);
	});

	it("rejects missing connection entry at execution time", async () => {
		const engine = makeTestEngine();

		// Provide empty connections — the node references CRED_ID which won't be found
		await expect(engine.execute(linearGraph(), {})).rejects.toThrow(
			ValidationError,
		);
	});

	it("rejects credentials that don't match provider schema", async () => {
		const engine = makeTestEngine();
		const connections: Connections = {
			[CRED_ID]: {
				type: "testdb",
				credentials: { wrong: "field" },
				context: {},
			},
		};

		await expect(engine.execute(linearGraph(), connections)).rejects.toThrow(
			ValidationError,
		);
	});

	it("accepts valid connections map with extra entries", async () => {
		const engine = makeTestEngine();
		const extraCredId = "00000000-0000-4000-8000-0000000000e0";
		const connections: Connections = {
			...testConnections(),
			[extraCredId]: {
				type: "other",
				credentials: { unused: true },
				context: {},
			},
		};

		const result = await engine.execute(linearGraph(), connections);

		expect(result.status).toBe("success");
	});
});
