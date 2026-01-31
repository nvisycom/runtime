import { Schema } from "effect";
import { Provider } from "#providers/base-provider.js";
import { Row } from "#datatypes/record-datatype.js";
import type { JsonValue } from "#datatypes/base-datatype.js";
import type { Resumable } from "#providers/stream-types.js";

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

class ExampleClient {
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

export const ExampleProvider = Provider.Factory({
	credentialSchema: Credentials,
	paramSchema: Params,
	connect: async (_credentials, _param) => {
		return Provider.Instance({ id: "example-db", dataClass: Row, client: new ExampleClient() })
			.withSource(Provider.Source({ contextSchema: Cursor, read }))
			.withSink(Provider.Sink({ write }));
	},
});
