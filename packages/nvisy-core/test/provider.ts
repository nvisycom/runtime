import { Schema } from "effect";
import { Provider } from "#providers/base-provider.js";
import { Stream } from "#streams/base-stream.js";
import { Row } from "#datatypes/record-datatype.js";
import type { JsonValue } from "#datatypes/base-datatype.js";
import type { Resumable } from "#streams/stream-types.js";

export const Credentials = Schema.Struct({
	host: Schema.String,
	port: Schema.Number,
});
export type Credentials = typeof Credentials.Type;

export const Params = Schema.Struct({
	table: Schema.String,
});
export type Params = typeof Params.Type;

export const Cursor = Schema.Struct({
	offset: Schema.Number,
});
export type Cursor = typeof Cursor.Type;

export class ExampleClient {
	readonly rows: ReadonlyArray<Record<string, JsonValue>> = [
		{ id: "1", name: "Alice" },
		{ id: "2", name: "Bob" },
		{ id: "3", name: "Charlie" },
	];
}

async function* read(
	client: ExampleClient,
	ctx: Cursor,
	_params: Params,
): AsyncGenerator<Resumable<Row, Cursor>> {
	for (let i = ctx.offset; i < client.rows.length; i++) {
		yield { data: new Row(client.rows[i]!), context: { offset: i + 1 } };
	}
}

async function write(
	_client: ExampleClient,
	_items: ReadonlyArray<Row>,
	_params: Params,
): Promise<void> {
	// no-op
}

export const ExampleProvider = Provider.withAuthentication("example", {
	credentials: Credentials,
	connect: async (_credentials) => ({
		client: new ExampleClient(),
		disconnect: async () => {},
	}),
});

export const ExampleProviderWithId = Provider.withAuthentication("custom-provider-id", {
	credentials: Credentials,
	connect: async (_credentials) => ({
		client: new ExampleClient(),
		disconnect: async () => {},
	}),
});

export const ExampleSource = Stream.createSource("read", ExampleClient, {
	types: [Row, Cursor, Params],
	reader: read,
});

export const ExampleTarget = Stream.createTarget("write", ExampleClient, {
	types: [Row, Params],
	writer: write,
});
