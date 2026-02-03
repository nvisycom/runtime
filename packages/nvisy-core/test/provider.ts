import { z } from "zod";
import type { JsonValue } from "../src/datatypes/base-datatype.js";
import { Row } from "../src/datatypes/record-datatype.js";
import { Provider } from "../src/providers.js";
import type { Resumable } from "../src/streams.js";
import { StreamFactory } from "../src/streams.js";

export const Credentials = z.object({
	host: z.string(),
	port: z.number(),
});
export type Credentials = z.infer<typeof Credentials>;

export const Params = z.object({
	table: z.string(),
});
export type Params = z.infer<typeof Params>;

export const Cursor = z.object({
	offset: z.number(),
});
export type Cursor = z.infer<typeof Cursor>;

export class ExampleClient {
	readonly rows: ReadonlyArray<Record<string, JsonValue>> = [
		{ id: "1", name: "Alice" },
		{ id: "2", name: "Bob" },
		{ id: "3", name: "Charlie" },
	];
}

async function* readStream(
	client: ExampleClient,
	ctx: Cursor,
	_params: Params,
): AsyncIterable<Resumable<Row, Cursor>> {
	const items = client.rows.slice(ctx.offset).map((row, i) => ({
		data: new Row(row),
		context: { offset: ctx.offset + i + 1 },
	}));
	yield* items;
}

export const ExampleProvider = Provider.withAuthentication("example", {
	credentials: Credentials,
	connect: async (_credentials) => ({
		client: new ExampleClient(),
		disconnect: async () => {},
	}),
});

export const ExampleProviderWithId = Provider.withAuthentication(
	"custom-provider-id",
	{
		credentials: Credentials,
		connect: async (_credentials) => ({
			client: new ExampleClient(),
			disconnect: async () => {},
		}),
	},
);

export const ExampleSource = StreamFactory.createSource("read", ExampleClient, {
	types: [Row, Cursor, Params],
	reader: (client, ctx, params) => readStream(client, ctx, params),
});

export const ExampleTarget = StreamFactory.createTarget(
	"write",
	ExampleClient,
	{
		types: [Row, Params],
		writer: (_client, _params) => async (_item) => {},
	},
);
